import React, { useState, useEffect, useMemo } from 'react'
import { db } from '../lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import './CalendarPage.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const CalendarPage = ({ onNavigate }) => {
  const { user } = useAuth()
  const { isPro } = usePlan()
  const [sessions, setSessions] = useState([])
  const [tasks, setTasks] = useState([])
  const [examDate, setExamDate] = useState(null)
  const [examName, setExamName] = useState('')
  const [examInput, setExamInput] = useState('')
  const [examNameInput, setExamNameInput] = useState('')
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [view, setView] = useState('month')
  const [heatmap, setHeatmap] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = today.toDateString()

  // Load data
  useEffect(() => {
    if (!user?.uid) return
    const load = async () => {
      try {
        const [sessSnap, taskSnap] = await Promise.all([
          getDocs(query(collection(db, 'sessions'), where('user_id', '==', user.uid), where('completed', '==', true))),
          getDocs(query(collection(db, 'tasks'), where('user_id', '==', user.uid)))
        ])
        setSessions(sessSnap.docs.map(doc => doc.data()))
        setTasks(taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))

        const saved = localStorage.getItem(`ff_exam_date_${user.uid}`)
        const savedName = localStorage.getItem(`ff_exam_name_${user.uid}`)
        if (saved) { setExamDate(new Date(saved)); setExamInput(saved) }
        if (savedName) { setExamName(savedName); setExamNameInput(savedName) }
      } catch (err) {
        console.error('Calendar Load Error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.uid])

  const saveExam = () => {
    if (!examInput) return
    const d = new Date(examInput)
    setExamDate(d)
    setExamName(examNameInput || 'Exam')
    localStorage.setItem(`ff_exam_date_${user.uid}`, examInput)
    localStorage.setItem(`ff_exam_name_${user.uid}`, examNameInput || 'Exam')
  }

  const clearExam = () => {
    setExamDate(null)
    setExamName('')
    setExamInput('')
    setExamNameInput('')
    localStorage.removeItem(`ff_exam_date_${user.uid}`)
    localStorage.removeItem(`ff_exam_name_${user.uid}`)
  }

  // Build day data map
  const dayData = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      const date = s.created_at?.toDate ? s.created_at.toDate() : new Date(s.created_at)
      const d = date.toDateString()
      if (!map[d]) map[d] = { sessions: 0, minutes: 0, tasks: 0, tasksDone: 0 }
      map[d].sessions++
      map[d].minutes += Math.round((s.duration_seconds || 0) / 60)
    })
    tasks.forEach(t => {
      if (t.due_date === 'goal' || t.due_date === 'syllabus') return
      const date = t.created_at?.toDate ? t.created_at.toDate() : new Date(t.created_at)
      const d = date.toDateString()
      if (!map[d]) map[d] = { sessions: 0, minutes: 0, tasks: 0, tasksDone: 0 }
      map[d].tasks++
      if (t.completed) map[d].tasksDone++
    })
    return map
  }, [sessions, tasks])

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startDay = (first.getDay() + 6) % 7
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const days = []
    for (let i = 0; i < startDay; i++) {
      days.push({ date: new Date(viewYear, viewMonth, -startDay + i + 1), outside: true })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(viewYear, viewMonth, i), outside: false })
    }
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(viewYear, viewMonth + 1, i), outside: true })
      }
    }
    return days
  }, [viewMonth, viewYear])

  const maxMinutes = useMemo(() => {
    return Math.max(...Object.values(dayData).map(d => d.minutes), 1)
  }, [dayData])

  const navMonth = (dir) => {
    if (!isPro && dir !== 0) return
    let m = viewMonth + dir
    let y = viewYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setViewMonth(m)
    setViewYear(y)
  }

  const isExamDay = (date) => {
    if (!examDate) return false
    return date.toDateString() === examDate.toDateString()
  }

  // Countdown to exam
  const examCountdown = useMemo(() => {
    if (!examDate) return null
    const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
    if (diff < 0) return null
    if (diff === 0) return 'Today!'
    return `${diff} day${diff !== 1 ? 's' : ''} away`
  }, [examDate])

  // Week view data
  const weekDays = useMemo(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [])

  const selectedDayData = selectedDate ? dayData[selectedDate] : null
  const selectedDayTasks = selectedDate
    ? tasks.filter(t => {
        const d = t.created_at?.toDate ? t.created_at.toDate() : new Date(t.created_at)
        return d.toDateString() === selectedDate && t.due_date !== 'goal' && t.due_date !== 'syllabus'
      })
    : []

  return (
    <div className="canvas-layout">
      <main className="container" style={{ paddingBottom: '5rem' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="cal-page-title">Calendar</h1>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Exam countdown badge */}
            {examDate && examCountdown && (
              <div className="cal-exam-countdown">
                📋 <strong>{examName || 'Exam'}</strong> — {examCountdown}
              </div>
            )}

            {isPro && (
              <div className="cal-toggle-group">
                <button
                  onClick={() => setHeatmap(!heatmap)}
                  className={`cal-toggle-btn ${heatmap ? 'active' : ''}`}
                >
                  {heatmap ? '🔥 Heat' : 'Heat'}
                </button>
                <button
                  onClick={() => setView('month')}
                  className={`cal-toggle-btn ${view === 'month' ? 'active' : ''}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`cal-toggle-btn ${view === 'week' ? 'active' : ''}`}
                >
                  Week
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="cal-month-nav">
          <button
            onClick={() => navMonth(-1)}
            className={`cal-nav-arrow ${!isPro ? 'disabled' : ''}`}
            disabled={!isPro}
            title={!isPro ? 'Pro feature' : 'Previous month'}
          >
            ←
          </button>
          <h2 className="cal-month-title">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={() => navMonth(1)}
            className={`cal-nav-arrow ${!isPro ? 'disabled' : ''}`}
            disabled={!isPro}
            title={!isPro ? 'Pro feature' : 'Next month'}
          >
            →
          </button>
        </div>

        {/* Month View */}
        {view === 'month' && (
          <div className="cal-grid">
            {DAYS.map(d => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}

            {calendarDays.map(({ date, outside }, i) => {
              const key = date.toDateString()
              const data = dayData[key]
              const isToday = key === todayStr
              const isExam = isExamDay(date)
              const heatIntensity = heatmap && data ? Math.min(data.minutes / maxMinutes, 1) : 0
              const allDone = data && data.tasks > 0 && data.tasksDone === data.tasks

              return (
                <div
                  key={i}
                  className={[
                    'cal-cell',
                    outside ? 'cal-cell--outside' : '',
                    isToday ? 'cal-cell--today' : '',
                    isExam ? 'cal-cell--exam' : '',
                    selectedDate === key ? 'cal-cell--selected' : '',
                  ].join(' ')}
                  style={heatmap && data
                    ? { backgroundColor: `rgba(57, 211, 83, ${0.06 + heatIntensity * 0.28})` }
                    : undefined
                  }
                  onClick={() => setSelectedDate(key === selectedDate ? null : key)}
                >
                  <span className={`cal-date-num ${isToday ? 'cal-date-num--today' : ''}`}>
                    {date.getDate()}
                  </span>

                  {/* Session dots */}
                  {data && data.sessions > 0 && (
                    <div className="cal-dots">
                      {Array.from({ length: Math.min(data.sessions, 3) }).map((_, j) => (
                        <span key={j} className="cal-dot cal-dot--session" />
                      ))}
                    </div>
                  )}

                  {/* Task badge */}
                  {data && data.tasks > 0 && (
                    <span className={`cal-task-badge ${allDone ? 'cal-task-badge--complete' : ''}`}>
                      {allDone ? '✓' : `${data.tasksDone}/${data.tasks}`}
                    </span>
                  )}

                  {/* Exam */}
                  {isExam && (
                    <div className="cal-exam-label">{examName || 'Exam'}</div>
                  )}

                  {/* Activity bar */}
                  {data && data.minutes > 0 && (
                    <div
                      className="cal-activity-bar"
                      style={{ transform: `scaleX(${Math.min(data.minutes / maxMinutes, 1)})` }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Week View (Pro) */}
        {view === 'week' && isPro && (
          <div className="cal-week">
            {weekDays.map((date, i) => {
              const key = date.toDateString()
              const data = dayData[key]
              const isToday = key === todayStr
              const dayTasks = tasks.filter(t => {
                const td = t.created_at?.toDate ? t.created_at.toDate() : new Date(t.created_at)
                return t.due_date !== 'goal' && t.due_date !== 'syllabus' && td.toDateString() === key
              })

              return (
                <div key={i} className={`cal-week-col ${isToday ? 'cal-week-col--today' : ''}`}>
                  <div className="cal-week-header">
                    <span className="cal-week-dayname">{DAYS[i]}</span>
                    <span className={`cal-week-datenum ${isToday ? 'cal-date-num--today' : ''}`}>
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="cal-week-body">
                    {data && data.sessions > 0 && (
                      <div className="cal-week-event cal-week-event--session">
                        🎯 {data.sessions} session{data.sessions > 1 ? 's' : ''} · {data.minutes}m
                      </div>
                    )}

                    {dayTasks.map(t => (
                      <div
                        key={t.id}
                        className={`cal-week-event cal-week-event--task ${t.completed ? 'cal-week-event--done' : ''}`}
                      >
                        {t.completed ? '✓' : '○'} {t.title}
                      </div>
                    ))}

                    {isExamDay(date) && (
                      <div className="cal-week-event cal-week-event--exam">
                        📋 {examName || 'Exam Day'}
                      </div>
                    )}

                    {dayTasks.length === 0 && (!data || data.sessions === 0) && !isExamDay(date) && (
                      <div className="cal-week-empty">Free day</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Selected Day Detail */}
        {selectedDate && (
          <div className="cal-detail">
            <h3>
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            {selectedDayData ? (
              <>
                <div className="cal-detail-stats">
                  <div className="cal-detail-stat">
                    <strong>{selectedDayData.sessions}</strong>
                    <span>Sessions</span>
                  </div>
                  <div className="cal-detail-stat">
                    <strong>{selectedDayData.minutes}m</strong>
                    <span>Focused</span>
                  </div>
                  <div className="cal-detail-stat">
                    <strong>{selectedDayData.tasksDone}/{selectedDayData.tasks}</strong>
                    <span>Tasks Done</span>
                  </div>
                </div>
                {selectedDayTasks.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {selectedDayTasks.map(t => (
                      <div key={t.id} style={{
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: t.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                        textDecoration: t.completed ? 'line-through' : 'none',
                        opacity: t.completed ? 0.55 : 1,
                      }}>
                        <span style={{ fontSize: '0.6rem' }}>{t.completed ? '✓' : '○'}</span>
                        {t.title}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                No activity recorded for this day.
              </p>
            )}
          </div>
        )}

        {/* Exam Setter */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--text-secondary)' }}>
            📋 Set Exam Date
          </p>
          <div className="cal-exam-form">
            <input
              type="text"
              value={examNameInput}
              onChange={e => setExamNameInput(e.target.value)}
              placeholder="Exam name (e.g. Finals)"
              className="cal-exam-input"
              style={{ width: '160px' }}
            />
            <input
              type="date"
              value={examInput}
              onChange={e => setExamInput(e.target.value)}
              className="cal-exam-input"
            />
            <button
              onClick={saveExam}
              className="cal-toggle-btn active"
              style={{ borderRadius: '8px', fontSize: '0.65rem' }}
            >
              Save
            </button>
            {examDate && (
              <button
                onClick={clearExam}
                className="cal-toggle-btn"
                style={{ borderRadius: '8px', fontSize: '0.65rem' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="cal-legend">
          <div className="cal-legend-item">
            <span className="cal-dot cal-dot--session" /> Focus Session
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-badge">✓</span> All Tasks Done
          </div>
          <div className="cal-legend-item">
            <span className="cal-legend-badge" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>2/3</span> Tasks Progress
          </div>
          {examDate && (
            <div className="cal-legend-item">
              <span className="cal-legend-exam" /> {examName || 'Exam'}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

export default CalendarPage
