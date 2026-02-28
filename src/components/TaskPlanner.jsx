import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { usePlan } from '../contexts/PlanContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import ProGate from './ProGate'
import '../pages/Dashboard.css'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']

const TaskPlanner = () => {
  const { user } = useAuth()
  const { isPro } = usePlan()
  const toast = useToast()
  const { addNotification } = useNotifications()
  const [tasks, setTasks] = useState([])
  const hasReachedLimit = !isPro && tasks.length >= 20
  const [loading, setLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDeadline, setNewDeadline] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  // Add global shortcut 'N' for new task
  useKeyboardShortcuts([
    {
      key: 'n',
      action: () => {
        if (!hasReachedLimit) setIsAdding(true)
      }
    }
  ])

  const fetchTasks = () => {
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

  useEffect(() => {
    if (user) {
      fetchTasks()

      const handleTaskUpdated = (e) => {
        const { id, completed, deleted, added } = e.detail || {}
        if (id !== undefined && completed !== undefined) {
          setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
        } else if (added || deleted) {
          fetchTasks()
        }
      }
      window.addEventListener('task-updated', handleTaskUpdated)
      return () => window.removeEventListener('task-updated', handleTaskUpdated)
    }
  }, [user])

  const addTask = async () => {
    const title = newTitle.trim()
    if (!title || !user) { setIsAdding(false); setNewTitle(''); return }

    const tempId = `temp-${Date.now()}`
    setTasks(prev => [{ id: tempId, title, priority: newPriority, deadline_at: newDeadline || null, completed: false }, ...prev])
    setIsAdding(false)
    setNewTitle('')

    supabase
      .from('tasks')
      .insert([{ user_id: user.id, title, priority: newPriority, deadline_at: newDeadline || null }])
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          setTasks(prev => prev.filter(t => t.id !== tempId))
          toast('Failed to add task.', 'error')
          return
        }
        setTasks(prev => prev.map(t => t.id === tempId ? data : t))
        toast('Task added to the Ledger.', 'success')
        window.dispatchEvent(new CustomEvent('task-updated', { detail: { added: true } }))
      })
  }

  const toggleTask = async (id, current) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !current } : t))
    window.dispatchEvent(new CustomEvent('task-updated', { detail: { id, completed: !current } }))

    const { error } = await supabase.from('tasks').update({ completed: !current }).eq('id', id)
    
    if (error) {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: current } : t))
      window.dispatchEvent(new CustomEvent('task-updated', { detail: { id, completed: current } }))
      toast('Failed to update task sync.', 'error')
      console.error(error)
      return
    }

    if (!current) {
      toast('Task marked complete.', 'success')
      addNotification('Task Complete', 'Excellent work! One step closer to your goals.', 'success')
      
      // Play Task Completion Sound
      const pop = new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_f3152ef32d.mp3')
      pop.volume = 0.4
      pop.play().catch(e => console.log("Sound blocked:", e))
    }
  }

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    supabase.from('tasks').delete().eq('id', id)
    toast('Task removed from the Ledger.', 'info')
    window.dispatchEvent(new CustomEvent('task-updated', { detail: { deleted: true, id } }))
  }

  const startEdit = (task) => { setEditingId(task.id); setEditTitle(task.title) }

  const saveEdit = (id) => {
    const title = editTitle.trim()
    setEditingId(null)
    if (!title) return
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t))
    supabase.from('tasks').update({ title }).eq('id', id)
    toast('Task updated.', 'success')
    window.dispatchEvent(new CustomEvent('task-updated', { detail: { updated: true, id } }))
  }

  const incomplete = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  return (
    <div className="ledger-container">

      {/* ── Add Task — always at top ── */}
      {hasReachedLimit ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <ProGate feature="ledger tasks" inline onNavigatePricing={() => window.location.href = '/pricing'} />
        </div>
      ) : isAdding ? (
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
          <div className="add-task-controls" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
              className="priority-select"
              title="Deadline"
            />
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
              className="priority-select"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
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
      {loading && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="skeleton skeleton-text" style={{ height: '36px' }} />
          <div className="skeleton skeleton-text" style={{ height: '36px', width: '90%' }} />
          <div className="skeleton skeleton-text" style={{ height: '36px', width: '95%' }} />
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && tasks.length === 0 && (
        <div className="text-center py-8 opacity-70">
          <div className="text-4xl mb-3">📝</div>
          <p className="font-serif italic text-lg">Your ledger is clear.</p>
          <p className="text-xs mt-1 uppercase tracking-widest text-muted">Add your first task above.</p>
        </div>
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
              {task.priority === 'urgent' && <span className="pro-lock-badge" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>URGENT</span>}
            </div>
          )}
          <div className="ledger-meta flex flex-col items-end gap-1">
            {task.deadline_at && (
              <span style={{ fontSize: '0.55rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', color: new Date(task.deadline_at) < new Date() ? 'var(--danger)' : 'var(--text-secondary)' }}>
                DUE: {new Date(task.deadline_at).toLocaleDateString()}
              </span>
            )}
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => startEdit(task)} title="Edit" style={{ opacity: 0.4, fontSize: '0.8rem' }}>✎</button>
              <button onClick={() => deleteTask(task.id)} title="Delete" style={{ opacity: 0.4, fontSize: '1rem' }}>×</button>
            </div>
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
