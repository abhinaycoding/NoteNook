import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import './AnalyticsPage.css'

const AnalyticsPage = ({ onNavigate }) => {
  const { user } = useAuth()
  const [weeklyData, setWeeklyData] = useState([])
  const [taskStats, setTaskStats] = useState({ completed: 0, pending: 0, total: 0 })
  const [totalHours, setTotalHours] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchAnalytics = async () => {
    try {
      // Build last 7 days labels
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push({
          label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          date: d.toISOString().split('T')[0],
          hours: 0
        })
      }

      // Fetch sessions for past 7 days
      const sevenAgo = new Date()
      sevenAgo.setDate(sevenAgo.getDate() - 6)
      sevenAgo.setHours(0, 0, 0, 0)

      const { data: sessions } = await supabase
        .from('sessions')
        .select('duration_seconds, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenAgo.toISOString())

      // Map sessions to days
      ;(sessions || []).forEach(s => {
        const sessionDate = s.created_at.split('T')[0]
        const day = days.find(d => d.date === sessionDate)
        if (day) day.hours += parseFloat((s.duration_seconds / 3600).toFixed(2))
      })

      // Round hours
      const formatted = days.map(d => ({ ...d, hours: parseFloat(d.hours.toFixed(1)) }))
      setWeeklyData(formatted)

      // Total hours all time
      const { data: allSessions } = await supabase
        .from('sessions').select('duration_seconds').eq('user_id', user.id)
      const total = (allSessions || []).reduce((a, s) => a + s.duration_seconds, 0)
      setTotalHours((total / 3600).toFixed(1))

      // Task stats
      const { data: tasks } = await supabase
        .from('tasks').select('completed').eq('user_id', user.id)
      const completed = (tasks || []).filter(t => t.completed).length
      setTaskStats({ completed, pending: (tasks || []).length - completed, total: (tasks || []).length })

      // Streak: count consecutive days with sessions ending today
      let streak = 0
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const check = new Date(today)
        check.setDate(check.getDate() - i)
        const dateStr = check.toISOString().split('T')[0]
        const hasSession = (sessions || []).some(s => s.created_at.split('T')[0] === dateStr)
        if (hasSession) streak++
        else break
      }
      setStreakDays(streak)
    } catch (err) {
      console.error('Error fetching analytics:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const taskChartData = [
    { name: 'Done', value: taskStats.completed, color: '#2E5C50' },
    { name: 'Pending', value: taskStats.pending, color: '#E5E0D5' },
  ]

  return (
    <div className="canvas-layout">
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>NN.</div>
            <h1 className="text-xl font-serif text-muted italic ml-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>Analytics</h1>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="analytics-main container">
        {/* KPI Row */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-value">{totalHours}</div>
            <div className="kpi-label">Total Hours Studied</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{taskStats.completed}</div>
            <div className="kpi-label">Tasks Completed</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{streakDays}</div>
            <div className="kpi-label">Day Streak 🔥</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">
              {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
            </div>
            <div className="kpi-label">Completion Rate</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Weekly Study Hours Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Study Hours — Last 7 Days</h3>
            {loading ? <p className="text-xs text-muted italic">Loading data...</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'Inter', textTransform: 'uppercase' }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: '1px solid var(--border)' }}
                    formatter={(v) => [`${v}h`, 'Study']}
                  />
                  <Bar dataKey="hours" fill="var(--text-primary)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Task Completion Pie Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Task Completion</h3>
            {loading ? <p className="text-xs text-muted italic">Loading data...</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={taskChartData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="analytics-footer border-t border-ink pt-8 mt-8">
          <p className="font-serif italic text-2xl text-muted max-w-2xl">
            "An investment in knowledge pays the best interest."
          </p>
          <p className="text-xs uppercase tracking-widest text-muted mt-2">— Benjamin Franklin</p>
        </div>
      </main>
    </div>
  )
}

export default AnalyticsPage
