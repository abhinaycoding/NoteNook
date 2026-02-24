import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../pages/Dashboard.css'

const QUOTES = [
  "The volume of work is directly proportional to the depth of concentration applied.",
  "A scholar who knows how to rest, knows how to work.",
  "Do the hard task first. The rest of the day shall be easy.",
  "One deep hour beats ten scattered ones.",
  "Clarity of purpose produces clarity of action.",
]

const AnalyticsCards = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({ hoursToday: 0, tasksCompleted: 0, streak: 0, totalTasks: 0 })
  const quote = QUOTES[new Date().getDay() % QUOTES.length]

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)

      const [{ data: sessions }, { data: allTasks }] = await Promise.all([
        supabase.from('sessions').select('duration_seconds').eq('user_id', user.id).gte('created_at', today.toISOString()),
        supabase.from('tasks').select('id, completed').eq('user_id', user.id).not('due_date', 'eq', 'goal').not('due_date', 'eq', 'syllabus'),
      ])

      const totalSeconds = (sessions || []).reduce((s, r) => s + (r.duration_seconds || 0), 0)
      const completed = (allTasks || []).filter(t => t.completed).length
      const total = (allTasks || []).length

      setStats({
        hoursToday: (totalSeconds / 3600).toFixed(1),
        tasksCompleted: completed,
        totalTasks: total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      })
    } catch (err) {
      console.error('Stats error:', err.message)
    }
  }

  return (
    <div className="metrics-container">
      {/* Stat row */}
      <div className="metrics-row">
        <div className="metric-block">
          <div className="metric-number">{stats.hoursToday}</div>
          <div className="metric-label">Hours Today</div>
        </div>
        <div className="metric-block">
          <div className="metric-number">{String(stats.tasksCompleted).padStart(2, '0')}</div>
          <div className="metric-label">Tasks Done</div>
        </div>
        <div className="metric-block">
          <div className="metric-number">{stats.completionRate || 0}<span style={{ fontSize: '1.5rem' }}>%</span></div>
          <div className="metric-label">Completion</div>
        </div>
      </div>

      {/* Progress bar */}
      {stats.totalTasks > 0 && (
        <div className="metrics-progress-wrap">
          <div
            className="metrics-progress-fill"
            style={{ width: `${stats.completionRate}%` }}
          />
          <div className="metrics-progress-label">
            {stats.tasksCompleted} of {stats.totalTasks} tasks complete
          </div>
        </div>
      )}

      {/* Quote */}
      <div className="metrics-quote">
        <p className="font-serif italic text-muted">"{quote}"</p>
      </div>
    </div>
  )
}

export default AnalyticsCards
