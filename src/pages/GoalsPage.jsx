import React, { useState, useEffect, useRef, useMemo } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { usePlan } from '../contexts/PlanContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useTranslation } from '../contexts/LanguageContext'
import ProGate from '../components/ProGate'
import Confetti from '../components/Confetti'
import './GoalsPage.css'

import { db } from '../lib/firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore'

const GoalsPage = ({ onNavigate }) => {
  const { user } = useAuth()
  const { isPro } = usePlan()
  const toast = useToast()
  const { addNotification } = useNotifications()
  const { t } = useTranslation()
  const [goals, setGoals] = useState([])
  
  const hasReachedLimit = !isPro && goals.length >= 5
  const [newGoal, setNewGoal] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [stats, setStats] = useState({ sessions: 0, tasks: 0, hours: 0 })
  const [loading, setLoading] = useState(true)
  const [celebrate, setCelebrate] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!user?.uid) return
      
      try {
        setLoading(true)
        // Load Goals (Tasks with due_date == 'goal')
        const qTasks = query(
          collection(db, 'tasks'), 
          where('user_id', '==', user.uid),
          orderBy('created_at', 'asc')
        )
        const tasksSnap = await getDocs(qTasks)
        const allTasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        if (isMounted) {
          const goalsData = allTasks.filter(t => t.due_date === 'goal')
          setGoals(goalsData)
        }
        
        // Load Sessions
        const qSessions = query(collection(db, 'sessions'), where('user_id', '==', user.uid))
        const sessionsSnap = await getDocs(qSessions)
        const sessionsData = sessionsSnap.docs.map(doc => doc.data())

        if (isMounted) {
          const completedTasks = allTasks.filter(t => t.completed === true)
          const hours = sessionsData.reduce((a, s) => a + (s.duration_seconds || 0), 0) / 3600
          setStats({ 
            sessions: sessionsData.length, 
            tasks: completedTasks.length, 
            hours 
          })
          setErrorMsg('')
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          console.error("Goals Fetch Error:", err)
          setErrorMsg(t('goals.fetchFailed') + (err.message || String(err)))
          setLoading(false)
        }
      }
    }

    loadData()

    return () => { isMounted = false }
  }, [user?.uid])

  const addGoal = async () => {
    if (!newGoal.trim() || !user?.uid) return
    try {
      const payload = {
        user_id: user.uid,
        title: newGoal.trim(),
        due_date: 'goal',
        priority: newTarget || '0',
        completed: false,
        created_at: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'tasks'), payload)
      setGoals(prev => [...prev, { id: docRef.id, ...payload }])
      
      setNewGoal('')
      setNewTarget('')
      toast(t('goals.goalAdded'), 'success')
    } catch (err) {
      toast(t('goals.goalFailed'), 'error')
      console.error(err)
    }
  }

  // Track previously unlocked badges
  const unlockedBadges = useMemo(() => BADGES.filter(b => b.check(stats.sessions, stats.tasks, stats.hours)), [stats.sessions, stats.tasks, stats.hours])
  const prevBadgesCount = useRef(0)

  useEffect(() => {
    if (!loading && unlockedBadges.length > prevBadgesCount.current && prevBadgesCount.current > 0) {
      const newBadges = unlockedBadges.slice(prevBadgesCount.current)
      newBadges.forEach(badge => {
        addNotification(
          t('goals.milestoneUnlocked'),
          t('goals.badgeEarned').replace('{label}', badge.label).replace('{desc}', badge.desc),
          'success'
        )
      })
    }
    prevBadgesCount.current = unlockedBadges.length
  }, [unlockedBadges.length, loading, addNotification, unlockedBadges])

  const toggleGoal = async (id, current) => {
    if (!user?.uid) return
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !current } : g))
    
    try {
      await updateDoc(doc(db, 'tasks', id), { completed: !current })
      if (!current) {
        toast(t('goals.goalAchieved'), 'success')
        addNotification(t('goals.goalAchieved'), t('goals.goalAchievedNotif'), 'success')
        setCelebrate(true)
        setTimeout(() => setCelebrate(false), 3500)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteGoal = async (id) => {
    if (!user?.uid) return
    setGoals(prev => prev.filter(g => g.id !== id))
    try {
      await deleteDoc(doc(db, 'tasks', id))
      toast(t('goals.goalRemoved'), 'info')
    } catch (err) {
      console.error(err)
    }
  }



  return (
    <div className="canvas-layout">
      <Confetti active={celebrate} />
      <header className="canvas-header container">
        <div className="flex justify-between items-center border-b border-ink pb-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>NN.</div>
            <h1 className="text-xl font-serif text-muted italic ml-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>{t('goals.pageTitle')}</h1>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">{t('goals.backDashboard')}</button>
        </div>
      </header>

      <main className="goals-main container">
        <div className="goals-grid">

          {/* Left: Goals */}
          <div>
            <h3 className="section-label">{t('goals.monthlyGoals')}</h3>

            {hasReachedLimit ? (
              <ProGate feature="goals" inline onNavigatePricing={onNavigate} />
            ) : (
              <div className="add-goal-row">
                <input
                  type="text"
                  placeholder={t('goals.setNewGoal')}
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal()}
                  className="goal-input"
                />
                <input
                  type="text"
                  placeholder={t('goals.target')}
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  className="goal-target-input"
                />
                <button onClick={addGoal} className="btn-icon">+</button>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 mb-4 bg-red-900/20 border border-red-500/50 text-red-200 text-sm rounded">
                <strong>Debug Error:</strong> {errorMsg}
              </div>
            )}

            {loading ? (
              <p className="text-xs text-muted italic">{t('goals.loadingGoals')}</p>
            ) : goals.length === 0 ? (
              <p className="text-xs text-muted italic">{t('goals.noGoals')}</p>
            ) : (
              <div className="goals-list">
                {goals.map(goal => (
                  <div key={goal.id} className={`goal-row ${goal.completed ? 'done' : ''}`}>
                    <div
                      className={`ledger-check cursor-pointer ${goal.completed ? 'done' : ''}`}
                      onClick={() => toggleGoal(goal.id, goal.completed)}
                    />
                    <div className="goal-info" onClick={() => toggleGoal(goal.id, goal.completed)}>
                      <div className="goal-title">{goal.title}</div>
                      {goal.priority && goal.priority !== '0' && (
                        <div className="goal-target">Target: {goal.priority}</div>
                      )}
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="note-delete-btn" style={{ opacity: 0.4 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Progress Summary */}
            <div className="progress-summary border-t border-ink pt-6 mt-8">
              <h3 className="section-label">{t('goals.yourProgress')}</h3>
              <div className="progress-stats">
                <div className="progress-stat">
                  <span className="stat-num">{stats.sessions}</span>
                  <span className="stat-lbl">{t('goals.sessions')}</span>
                </div>
                <div className="progress-stat">
                  <span className="stat-num">{stats.tasks}</span>
                  <span className="stat-lbl">{t('goals.tasksDone')}</span>
                </div>
                <div className="progress-stat">
                  <span className="stat-num">{parseFloat(stats.hours).toFixed(1)}</span>
                  <span className="stat-lbl">{t('goals.hours')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Badges */}
          <div>
            <h3 className="section-label">{t('goals.achievements')}</h3>
            <div className="badges-grid">
              {BADGES.map(badge => {
                const unlocked = badge.check(stats.sessions, stats.tasks, stats.hours)
                return (
                  <div key={badge.id} className={`badge-card ${unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="badge-icon">{badge.icon}</div>
                    <div className="badge-label">{badge.label}</div>
                    <div className="badge-desc">{badge.desc}</div>
                    {unlocked && <div className="badge-status">{t('goals.earned')}</div>}
                  </div>
                )
              })}
            </div>

            {unlockedBadges.length > 0 && (
              <div className="mt-6 font-serif italic text-muted text-lg">
                "{unlockedBadges.length === BADGES.length
                  ? t('goals.allMastered')
                  : `${unlockedBadges.length} / ${BADGES.length} ${t('goals.milestonesReached')}`}"
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default GoalsPage
