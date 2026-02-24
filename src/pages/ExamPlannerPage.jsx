import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './ExamPlannerPage.css'

const COMMON_EXAMS = ['JEE Main', 'JEE Advanced', 'NEET', 'UPSC', 'CAT', 'GATE', 'CUET', 'Custom']

const ExamPlannerPage = ({ onNavigate }) => {
  const { user } = useAuth()
  const [examDate, setExamDate] = useState('')
  const [examName, setExamName] = useState('JEE Main')
  const [customExam, setCustomExam] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [topics, setTopics] = useState([])
  const [newTopic, setNewTopic] = useState('')
  const [newTopicSubject, setNewTopicSubject] = useState('Physics')
  const [saving, setSaving] = useState(false)

  // Load saved exam data from Supabase profile + localStorage
  useEffect(() => {
    if (user) loadExamData()
  }, [user])

  // Save exam date to localStorage whenever it changes
  useEffect(() => {
    if (examDate) localStorage.setItem(`ff_exam_date_${user?.id}`, examDate)
  }, [examDate])

  // Save exam name to localStorage whenever it changes
  useEffect(() => {
    if (examName) localStorage.setItem(`ff_exam_name_${user?.id}`, examName)
  }, [examName])

  // Real-time countdown tick
  useEffect(() => {
    if (!examDate) return
    const tick = setInterval(() => {
      const now = new Date()
      const target = new Date(examDate)
      const diff = target - now
      if (diff <= 0) { setCountdown({ done: true }); return }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setCountdown({ days, hours, minutes, seconds })
    }, 1000)
    return () => clearInterval(tick)
  }, [examDate])

  const loadExamData = async () => {
    try {
      // Restore from localStorage first (fast, no network)
      const savedDate = localStorage.getItem(`ff_exam_date_${user.id}`)
      const savedName = localStorage.getItem(`ff_exam_name_${user.id}`)
      if (savedDate) setExamDate(savedDate)
      if (savedName) setExamName(savedName)

      // Load topics from tasks table
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('due_date', 'syllabus')
        .order('created_at', { ascending: true })
      if (data) setTopics(data)

      // Load exam name from profile as fallback
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_exam')
        .eq('id', user.id)
        .single()
      if (profile?.target_exam && !savedName) setExamName(profile.target_exam)
    } catch (err) {
      console.error('Error loading exam data:', err.message)
    }
  }

  const handleAddTopic = async () => {
    if (!newTopic.trim()) return
    setSaving(true)
    
    try {
      const { data, error } = await supabase.from('tasks').insert([{
        user_id: user.id,
        title: newTopic.trim(),
        due_date: 'syllabus',
        priority: newTopicSubject
      }]).select().single()
      
      if (error) throw error
      if (data) setTopics(prev => [...prev, data])
      setNewTopic('')
    } catch (err) {
      console.error('Error adding topic:', err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleTopic = async (id, current) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, completed: !current } : t))
    await supabase.from('tasks').update({ completed: !current }).eq('id', id)
  }

  const deleteTopic = async (id) => {
    setTopics(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const completedCount = topics.filter(t => t.completed).length
  const progressPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0
  const displayExam = examName === 'Custom' ? customExam : examName

  // Group topics by subject (priority field)
  const subjects = [...new Set(topics.map(t => t.priority).filter(Boolean))]

  return (
    <div className="canvas-layout">
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>FF.</div>
            <h1 className="text-xl font-serif text-muted italic ml-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>Exam Planner</h1>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="exam-main container">
        <div className="exam-grid">
          
          {/* Left: Countdown */}
          <div className="exam-left">
            <div className="exam-setup card">
              <h3 className="section-label">Target Examination</h3>
              <div className="flex gap-2 flex-wrap mb-4">
                {COMMON_EXAMS.map(e => (
                  <button
                    key={e}
                    onClick={() => setExamName(e)}
                    className={`exam-tag ${examName === e ? 'active' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              {examName === 'Custom' && (
                <input
                  type="text"
                  placeholder="Exam name..."
                  value={customExam}
                  onChange={e => setCustomExam(e.target.value)}
                  className="w-full bg-transparent border-b border-ink outline-none py-2 font-serif text-xl mb-4"
                />
              )}
              <h3 className="section-label mt-4">Examination Date</h3>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="exam-date-input"
              />
            </div>

            {/* Countdown Display */}
            {countdown && !countdown.done ? (
              <div className="countdown-display">
                <div className="countdown-title">{displayExam || 'Exam'} in</div>
                <div className="countdown-numbers">
                  <div className="countdown-unit">
                    <span className="countdown-num">{String(countdown.days).padStart(3, '0')}</span>
                    <span className="countdown-label">Days</span>
                  </div>
                  <div className="countdown-sep">:</div>
                  <div className="countdown-unit">
                    <span className="countdown-num">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="countdown-label">Hrs</span>
                  </div>
                  <div className="countdown-sep">:</div>
                  <div className="countdown-unit">
                    <span className="countdown-num">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="countdown-label">Min</span>
                  </div>
                  <div className="countdown-sep">:</div>
                  <div className="countdown-unit">
                    <span className="countdown-num">{String(countdown.seconds).padStart(2, '0')}</span>
                    <span className="countdown-label">Sec</span>
                  </div>
                </div>
              </div>
            ) : countdown?.done ? (
              <div className="countdown-display text-center">
                <p className="font-serif text-2xl text-primary">Examination Day has arrived. Best of luck, Scholar.</p>
              </div>
            ) : (
              <div className="countdown-display opacity-40">
                <div className="countdown-title">Select a date to begin countdown</div>
              </div>
            )}
          </div>

          {/* Right: Syllabus Tracker */}
          <div className="exam-right">
            <div className="syllabus-header">
              <h3 className="section-label">Syllabus Tracker</h3>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="text-xs text-muted uppercase tracking-widest mt-1">
                {completedCount} / {topics.length} topics covered — {progressPct}%
              </div>
            </div>

            {/* Add Topic */}
            <div className="add-topic-row">
              <select
                value={newTopicSubject}
                onChange={e => setNewTopicSubject(e.target.value)}
                className="subject-select"
              >
                {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'History', 'Geography', 'Economics', 'Other'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Add a topic..."
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
                className="topic-input"
              />
              <button onClick={handleAddTopic} className="btn-icon" disabled={saving}>+</button>
            </div>

            {/* Topics by Subject */}
            <div className="topics-list">
              {subjects.length === 0 && (
                <p className="text-xs text-muted italic mt-4">No topics yet. Add chapters from your syllabus.</p>
              )}
              {subjects.map(subject => (
                <div key={subject} className="subject-group">
                  <div className="subject-group-title">{subject}</div>
                  {topics.filter(t => t.priority === subject).map(topic => (
                    <div key={topic.id} className={`topic-row ${topic.completed ? 'done' : ''}`}>
                      <div
                        className={`ledger-check cursor-pointer ${topic.completed ? 'done' : ''}`}
                        onClick={() => toggleTopic(topic.id, topic.completed)}
                      />
                      <span className="topic-title">{topic.title}</span>
                      <button onClick={() => deleteTopic(topic.id)} className="note-delete-btn" style={{ opacity: 0.4 }}>×</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default ExamPlannerPage
