import React, { useState, useEffect, useRef, useMemo } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { usePlan } from '../contexts/PlanContext'
import { useNotifications } from '../contexts/NotificationContext'
import ProGate from '../components/ProGate'
import Confetti from '../components/Confetti'
import './GoalsPage.css'

const BADGES = [
  { id: 'first_session', icon: '🎯', label: 'First Focus', desc: 'Complete your first timer session', check: (s) => s >= 1 },
  { id: 'five_sessions', icon: '🔥', label: 'On Fire', desc: '5 focus sessions completed', check: (s) => s >= 5 },
  { id: 'ten_tasks', icon: '📋', label: 'Task Master', desc: '10 tasks completed', check: (s, t) => t >= 10 },
  { id: 'ten_hours', icon: '⏰', label: 'Time Scholar', desc: '10 total hours studied', check: (s, t, h) => h >= 10 },
  { id: 'twenty_five_hours', icon: '🏆', label: 'Dedicated', desc: '25 total hours studied', check: (s, t, h) => h >= 25 },
  { id: 'fifty_tasks', icon: '⭐', label: 'Completionist', desc: '50 tasks completed', check: (s, t) => t >= 50 },
]

const GoalsPage = ({ onNavigate }) => {
  const { user, session } = useAuth()
  const { isPro } = usePlan()
  const toast = useToast()
  const { addNotification } = useNotifications()
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
      if (!user || !session) return
      
      try {
        const url = import.meta.env.VITE_SUPABASE_URL
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        const headers = {
          'apikey': key,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
        
        const tasksRes = await fetch(`${url}/rest/v1/tasks?user_id=eq.${user.id}&select=*&order=created_at.asc`, { headers })
        if (!tasksRes.ok) throw new Error(`Tasks HTTP error! status: ${tasksRes.status}`)
        const allTasks = await tasksRes.json()
        
        if (isMounted) {
          const goalsData = (allTasks || []).filter(t => t.due_date === 'goal')
          setGoals(goalsData)
        }
        
        const sessionsRes = await fetch(`${url}/rest/v1/sessions?user_id=eq.${user.id}&select=duration_seconds`, { headers })
        if (!sessionsRes.ok) throw new Error(`Sessions HTTP error! status: ${sessionsRes.status}`)
        const sessionsData = await sessionsRes.json()

        if (isMounted) {
          const completedTasks = (allTasks || []).filter(t => t.completed === true)
          const hours = (sessionsData || []).reduce((a, s) => a + (s.duration_seconds || 0), 0) / 3600
          setStats({ 
            sessions: (sessionsData || []).length, 
            tasks: completedTasks.length, 
            hours 
          })
          setErrorMsg('')
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          console.error("Goals Fetch Error:", err)
          setErrorMsg('Failed to fetch data: ' + (err.message || String(err)))
          setLoading(false)
        }
      }
    }

    // 100ms delay helps bypass the StrictMode immediate double-unmount race condition
    const timer = setTimeout(() => {
      loadData()
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [user, session])

  const getDirectHeaders = () => {
    return {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }

  const addGoal = async () => {
    if (!newGoal.trim() || !session) return
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tasks`
      const payload = {
        user_id: user.id,
        title: newGoal.trim(),
        due_date: 'goal',
        priority: newTarget || '0',
        completed: false
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: getDirectHeaders(),
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const inserted = await res.json()
      if (inserted && inserted.length > 0) {
        setGoals(prev => [...prev, inserted[0]])
      }
      setNewGoal('')
      setNewTarget('')
      toast('Goal committed to the canvas.', 'success')
    } catch (err) {
      toast('Failed to add goal.', 'error')
      console.error(err)
    }
  }

  // Track previously unlocked badges to trigger notifications on new ones
  const unlockedBadges = useMemo(() => BADGES.filter(b => b.check(stats.sessions, stats.tasks, stats.hours)), [stats.sessions, stats.tasks, stats.hours])
  const prevBadgesCount = useRef(0)

  useEffect(() => {
    // Only fire notifications if we've already loaded and the count actually increased
    if (!loading && unlockedBadges.length > prevBadgesCount.current && prevBadgesCount.current > 0) {
      const newBadges = unlockedBadges.slice(prevBadgesCount.current)
      newBadges.forEach(badge => {
        addNotification(
          'Milestone Unlocked!',
          `You earned the "${badge.label}" badge: ${badge.desc}`,
          'success'
        )
      })
    }
    prevBadgesCount.current = unlockedBadges.length
  }, [unlockedBadges.length, loading, addNotification, unlockedBadges])

  const toggleGoal = async (id, current) => {
    if (!session) return
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !current } : g))
    
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`
      const headers = getDirectHeaders()
      // For PATCH, we must omit the return=representation prefer header or use return=minimal
      headers['Prefer'] = 'return=minimal'

      await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ completed: !current })
      })
      if (!current) {
        toast('Goal achieved! Well done.', 'success')
        addNotification('Goal Achieved', 'You completed a monthly goal. Keep up the momentum!', 'success')
        setCelebrate(true)
        setTimeout(() => setCelebrate(false), 3500)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteGoal = async (id) => {
    if (!session) return
    setGoals(prev => prev.filter(g => g.id !== id))
    
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`
      await fetch(url, {
        method: 'DELETE',
        headers: getDirectHeaders()
      })
      toast('Goal removed.', 'info')
    } catch (err) {
      console.error(err)
    }
  }



  return (
    <div className="canvas-layout">
      <Confetti active={celebrate} />
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>NN.</div>
            <h1 className="text-xl font-serif text-muted italic ml-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>Goals & Milestones</h1>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">← Dashboard</button>
        </div>
      </header>

      <main className="goals-main container">
        <div className="goals-grid">

          {/* Left: Goals */}
          <div>
            <h3 className="section-label">Monthly Goals</h3>

            {hasReachedLimit ? (
              <ProGate feature="goals" inline onNavigatePricing={onNavigate} />
            ) : (
              <div className="add-goal-row">
                <input
                  type="text"
                  placeholder="Set a new goal..."
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal()}
                  className="goal-input"
                />
                <input
                  type="text"
                  placeholder="Target (e.g. 20hrs)"
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
              <p className="text-xs text-muted italic">Loading goals...</p>
            ) : goals.length === 0 ? (
              <p className="text-xs text-muted italic">No goals set. Chart your course, Scholar.</p>
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
              <h3 className="section-label">Your Progress</h3>
              <div className="progress-stats">
                <div className="progress-stat">
                  <span className="stat-num">{stats.sessions}</span>
                  <span className="stat-lbl">Sessions</span>
                </div>
                <div className="progress-stat">
                  <span className="stat-num">{stats.tasks}</span>
                  <span className="stat-lbl">Tasks Done</span>
                </div>
                <div className="progress-stat">
                  <span className="stat-num">{parseFloat(stats.hours).toFixed(1)}</span>
                  <span className="stat-lbl">Hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Badges */}
          <div>
            <h3 className="section-label">Achievement Milestones</h3>
            <div className="badges-grid">
              {BADGES.map(badge => {
                const unlocked = badge.check(stats.sessions, stats.tasks, stats.hours)
                return (
                  <div key={badge.id} className={`badge-card ${unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="badge-icon">{badge.icon}</div>
                    <div className="badge-label">{badge.label}</div>
                    <div className="badge-desc">{badge.desc}</div>
                    {unlocked && <div className="badge-status">✓ Earned</div>}
                  </div>
                )
              })}
            </div>

            {unlockedBadges.length > 0 && (
              <div className="mt-6 font-serif italic text-muted text-lg">
                "{unlockedBadges.length === BADGES.length
                  ? 'You have mastered the canvas. A true Scholar.'
                  : `${unlockedBadges.length} of ${BADGES.length} milestones reached. Keep going.`}"
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default GoalsPage
