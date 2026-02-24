import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './GoalsPage.css'

const BADGES = [
  { id: 'first_session', icon: '🎯', label: 'First Focus', desc: 'Complete your first timer session', check: (s, t) => s >= 1 },
  { id: 'five_sessions', icon: '🔥', label: 'On Fire', desc: '5 focus sessions completed', check: (s) => s >= 5 },
  { id: 'ten_tasks', icon: '📋', label: 'Task Master', desc: '10 tasks completed', check: (s, t) => t >= 10 },
  { id: 'ten_hours', icon: '⏰', label: 'Time Scholar', desc: '10 total hours studied', check: (s, t, h) => h >= 10 },
  { id: 'twenty_five_hours', icon: '🏆', label: 'Dedicated', desc: '25 total hours studied', check: (s, t, h) => h >= 25 },
  { id: 'fifty_tasks', icon: '⭐', label: 'Completionist', desc: '50 tasks completed', check: (s, t) => t >= 50 },
]

const GoalsPage = ({ onNavigate }) => {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [stats, setStats] = useState({ sessions: 0, tasks: 0, hours: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) { fetchGoals(); fetchStats() }
  }, [user])

  const fetchGoals = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('due_date', 'goal')
        .order('created_at', { ascending: true })
      if (data) setGoals(data)
    } catch (err) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: sessions } = await supabase.from('sessions').select('duration_seconds').eq('user_id', user.id)
      const { data: tasks } = await supabase.from('tasks').select('id').eq('user_id', user.id).eq('completed', true)
      const totalHours = (sessions || []).reduce((a, s) => a + s.duration_seconds, 0) / 3600
      setStats({ sessions: (sessions || []).length, tasks: (tasks || []).length, hours: totalHours })
    } catch (err) {
      console.error(err.message)
    }
  }

  const addGoal = async () => {
    if (!newGoal.trim()) return
    try {
      const { data, error } = await supabase.from('tasks').insert([{
        user_id: user.id,
        title: newGoal.trim(),
        due_date: 'goal',
        priority: newTarget || '0',
        completed: false
      }]).select().single()
      if (error) throw error
      if (data) setGoals(prev => [...prev, data])
      setNewGoal('')
      setNewTarget('')
    } catch (err) {
      console.error(err.message)
    }
  }

  const toggleGoal = async (id, current) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !current } : g))
    await supabase.from('tasks').update({ completed: !current }).eq('id', id)
  }

  const deleteGoal = async (id) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const unlockedBadges = BADGES.filter(b => b.check(stats.sessions, stats.tasks, stats.hours))

  return (
    <div className="canvas-layout">
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>FF.</div>
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
