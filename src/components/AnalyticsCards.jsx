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

const AnimatedCounter = ({ value, isDecimal = false, duration = 1500, padStart = 0 }) => {
  const finalValue = parseFloat(value)
  const isInvalid = isNaN(finalValue)
  
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (isInvalid) {
      setCount(0)
      return
    }

    let startTimestamp = null
    let frameId = null

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(finalValue * easeProgress)

      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      } else {
        setCount(finalValue)
      }
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [finalValue, isInvalid, duration])

  if (isInvalid) return <span>{value}</span>

  let displayValue = isDecimal ? count.toFixed(1) : Math.round(count).toString()
  if (padStart > 0 && !isDecimal) {
    displayValue = displayValue.padStart(padStart, '0')
  }

  return <span>{displayValue}</span>
}

const AnalyticsCards = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({ 
    hoursToday: 0, 
    tasksCompleted: 0, 
    streak: 0, 
    totalTasks: 0,
    completionRate: 0 
  })
  const [loading, setLoading] = useState(true)
  const quote = QUOTES[new Date().getDay() % QUOTES.length]

  const fetchStats = async () => {
    if (!user) return
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)

      const [{ data: sessions }, { data: allTasks }] = await Promise.all([
        supabase.from('sessions').select('duration_seconds').eq('user_id', user.id).gte('created_at', today.toISOString()),
        supabase.from('tasks').select('id, completed, due_date').eq('user_id', user.id),
      ])

      // Harmonized filter with TaskPlanner
      const filteredTasks = (allTasks || []).filter(t => t.due_date !== 'goal' && t.due_date !== 'syllabus')
      
      const totalSeconds = (sessions || []).reduce((s, r) => s + (r.duration_seconds || 0), 0)
      const completedCount = filteredTasks.filter(t => t.completed).length
      const totalCount = filteredTasks.length

      setStats(prev => ({
        ...prev,
        hoursToday: (totalSeconds / 3600).toFixed(1),
        tasksCompleted: completedCount,
        totalTasks: totalCount,
        completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      }))
    } catch (err) {
      console.error('Stats error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchStats()

      const handleUpdate = () => fetchStats()
      window.addEventListener('task-updated', handleUpdate)
      window.addEventListener('session-saved', handleUpdate)

      return () => {
        window.removeEventListener('task-updated', handleUpdate)
        window.removeEventListener('session-saved', handleUpdate)
      }
    }
  }, [user])

  if (loading) {
    return (
      <div className="metrics-container" style={{ gap: '1.5rem' }}>
        <div className="flex justify-between gap-4">
          <div className="skeleton" style={{ height: '60px', flex: 1 }} />
          <div className="skeleton" style={{ height: '60px', flex: 1 }} />
          <div className="skeleton" style={{ height: '60px', flex: 1 }} />
        </div>
        <div className="skeleton" style={{ height: '8px', width: '100%' }} />
        <div className="skeleton" style={{ height: '20px', width: '80%', margin: '0 auto' }} />
      </div>
    )
  }

  return (
    <div className="metrics-container">
      {/* Stat row */}
      <div className="metrics-row">
        <div className="metric-block">
          <div className="metric-number">
            <AnimatedCounter value={stats.hoursToday} isDecimal={true} />
          </div>
          <div className="metric-label">Hours Today</div>
        </div>
        <div className="metric-block">
          <div className="metric-number">
            <AnimatedCounter value={stats.tasksCompleted} padStart={2} />
          </div>
          <div className="metric-label">Tasks Done</div>
        </div>
        <div className="metric-block">
          <div className="metric-number">
            <AnimatedCounter value={stats.completionRate || 0} />
            <span style={{ fontSize: '1.5rem' }}>%</span>
          </div>
          <div className="metric-label">Completion</div>
        </div>
      </div>

      {/* Circular Progress */}
      {stats.totalTasks > 0 && (
        <div className="metrics-progress-wrap">
          <div className="circular-progress">
            <svg viewBox="0 0 100 100">
              {/* Background Track */}
              <circle 
                className="track" 
                cx="50" cy="50" r="40" 
              />
              {/* Animated Fill */}
              <circle 
                className="fill" 
                cx="50" cy="50" r="40" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * stats.completionRate) / 100}
              />
            </svg>
          </div>
          <div className="metrics-progress-info">
            <div className="metrics-progress-label">Daily Progress</div>
            <div className="metrics-progress-sub">
              {stats.tasksCompleted} of {stats.totalTasks} Tasks
            </div>
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
