import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../pages/Dashboard.css'

const PRIORITIES = ['Today', 'Tomorrow', 'This Week', 'Later']

const TaskPlanner = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('Today')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    if (user) {
      setLoading(true)
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setTasks(data.filter(t => t.due_date !== 'goal' && t.due_date !== 'syllabus'))
          } else if (error) {
            console.error('Ledger fetch error:', error.message)
          }
          setLoading(false)
        })
    }
  }, [user])

  const addTask = async () => {
    const title = newTitle.trim()
    if (!title || !user) { setIsAdding(false); setNewTitle(''); return }

    const tempId = `temp-${Date.now()}`
    setTasks(prev => [{ id: tempId, title, due_date: newPriority, completed: false }, ...prev])
    setIsAdding(false)
    setNewTitle('')

    supabase
      .from('tasks')
      .insert([{ user_id: user.id, title, due_date: newPriority }])
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          setTasks(prev => prev.filter(t => t.id !== tempId))
          return
        }
        setTasks(prev => prev.map(t => t.id === tempId ? data : t))
      })
  }

  const toggleTask = (id, current) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !current } : t))
    supabase.from('tasks').update({ completed: !current }).eq('id', id)
  }

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    supabase.from('tasks').delete().eq('id', id)
  }

  const startEdit = (task) => { setEditingId(task.id); setEditTitle(task.title) }

  const saveEdit = (id) => {
    const title = editTitle.trim()
    setEditingId(null)
    if (!title) return
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t))
    supabase.from('tasks').update({ title }).eq('id', id)
  }

  const incomplete = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  return (
    <div className="ledger-container">

      {/* ── Add Task — always at top ── */}
      {isAdding ? (
        <div className="add-task-form">
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addTask()
              if (e.key === 'Escape') { setIsAdding(false); setNewTitle('') }
            }}
            placeholder="What needs to be done?"
            className="add-task-input"
          />
          <div className="add-task-controls">
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
              className="priority-select"
            >
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <button onClick={addTask} className="btn-add-confirm">✓ Add</button>
            <button onClick={() => { setIsAdding(false); setNewTitle('') }} className="btn-add-cancel">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsAdding(true)} className="add-task-trigger">
          <span className="add-task-plus">+</span>
          <span>Add a task</span>
        </button>
      )}

      {/* ── Loading ── */}
      {loading && <p className="text-xs text-muted italic mt-4">Loading tasks...</p>}

      {/* ── Empty State ── */}
      {!loading && tasks.length === 0 && (
        <p className="text-xs text-muted italic mt-6">
          Your ledger is clear. Add your first task above ↑
        </p>
      )}

      {/* ── Incomplete Tasks ── */}
      {incomplete.map(task => (
        <div key={task.id} className="ledger-row" style={{ alignItems: 'center' }}>
          <div
            className={`ledger-check cursor-pointer ${task.completed ? 'done' : ''}`}
            onClick={() => toggleTask(task.id, task.completed)}
          />
          {editingId === task.id ? (
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => saveEdit(task.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEdit(task.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              className="ledger-title bg-transparent border-b border-ink outline-none"
              style={{ flexGrow: 1 }}
            />
          ) : (
            <div
              className="ledger-title cursor-pointer"
              onClick={() => toggleTask(task.id, task.completed)}
              onDoubleClick={() => startEdit(task)}
              title="Double-click to edit"
            >
              {task.title}
            </div>
          )}
          <div className="ledger-meta flex items-center gap-3">
            <span style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {task.due_date}
            </span>
            <button onClick={() => startEdit(task)} title="Edit" style={{ opacity: 0.4, fontSize: '0.9rem' }}>✎</button>
            <button onClick={() => deleteTask(task.id)} title="Delete" style={{ opacity: 0.4, fontSize: '1.1rem' }}>×</button>
          </div>
        </div>
      ))}

      {/* ── Completed Tasks ── */}
      {done.length > 0 && (
        <div style={{ marginTop: '1.5rem', opacity: 0.45 }}>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
            Completed ({done.length})
          </div>
          {done.map(task => (
            <div key={task.id} className="ledger-row" style={{ alignItems: 'center' }}>
              <div
                className="ledger-check cursor-pointer done"
                onClick={() => toggleTask(task.id, task.completed)}
              />
              <div
                className="ledger-title cursor-pointer done"
                onClick={() => toggleTask(task.id, task.completed)}
              >
                {task.title}
              </div>
              <div className="ledger-meta">
                <button onClick={() => deleteTask(task.id)} title="Delete" style={{ opacity: 0.5, fontSize: '1rem' }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default TaskPlanner
