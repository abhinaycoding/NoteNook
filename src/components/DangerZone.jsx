import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/LanguageContext'
import '../pages/Dashboard.css' // uses ledger styles

const DangerZone = () => {
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const [urgentTasks, setUrgentTasks] = useState([])

  useEffect(() => {
    if (!user) return

    const fetchUrgent = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)

      if (error || !data) return

      // Filter: priority === 'urgent' OR deadline within 48 hours
      const now = new Date()
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000)

      const dangerous = data.filter(t => {
        if (t.priority === 'urgent') return true
        if (t.deadline_at) {
          const deadline = new Date(t.deadline_at)
          return deadline <= in48Hours
        }
        return false
      })

      // Sort by easiest to nearest deadline
      dangerous.sort((a, b) => {
        // urgent always first
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1
        // then by deadline (earliest first)
        if (a.deadline_at && b.deadline_at) {
          return new Date(a.deadline_at) - new Date(b.deadline_at)
        }
        if (a.deadline_at) return -1
        if (b.deadline_at) return 1
        return 0
      })

      setUrgentTasks(dangerous)
    }

    fetchUrgent()
    
    // Refresh randomly or polling isn't great, relying on interval (every 1 min)
    const interval = setInterval(fetchUrgent, 60000)

    const handleTaskUpdated = (e) => {
      const { id, completed, deleted, added, updated } = e.detail || {}
      if (completed || deleted) {
        setUrgentTasks(prev => prev.filter(t => t.id !== id))
      } else {
        fetchUrgent()
      }
    }
    window.addEventListener('task-updated', handleTaskUpdated)
    
    // Legacy support in case it was used elsewhere
    window.addEventListener('task-completed', fetchUrgent)

    return () => {
      clearInterval(interval)
      window.removeEventListener('task-updated', handleTaskUpdated)
      window.removeEventListener('task-completed', fetchUrgent)
    }
  }, [user])

  const completeTask = async (id) => {
    // Optimistic update
    const taskBackup = urgentTasks.find(t => t.id === id)
    setUrgentTasks(prev => prev.filter(t => t.id !== id))
    window.dispatchEvent(new CustomEvent('task-updated', { detail: { id, completed: true } }))

    // Update supabase
    const { error } = await supabase.from('tasks').update({ completed: true }).eq('id', id)
    
    if (error && taskBackup) {
      // Proper rollback: restore the task back into the list
      setUrgentTasks(prev => {
        const alreadyPresent = prev.some(t => t.id === taskBackup.id)
        return alreadyPresent ? prev : [taskBackup, ...prev]
      })
      window.dispatchEvent(new CustomEvent('task-updated', { detail: { id: taskBackup.id, completed: false } }))
    }
  }

  if (urgentTasks.length === 0) return null

  return (
    <div style={{ marginBottom: '3rem', padding: '1.5rem', border: '2px dashed var(--danger)', backgroundColor: 'rgba(204, 75, 44, 0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h2 className="text-xl font-serif text-danger uppercase tracking-widest font-bold m-0" style={{ color: 'var(--danger)' }}>
          {t('dangerZone.title')}
        </h2>
        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--danger)', opacity: 0.8 }}>
          {t('dangerZone.subtitle')}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {urgentTasks.map(task => {
          const isOverdue = task.deadline_at && new Date(task.deadline_at) < new Date()
          return (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(204, 75, 44, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  className="ledger-check cursor-pointer"
                  style={{ borderColor: 'var(--danger)' }}
                  onClick={() => completeTask(task.id)}
                  title={t('dangerZone.markComplete')}
                />
                <div className="font-serif text-lg" style={{ color: 'var(--text-primary)' }}>
                  {task.title}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {task.priority === 'urgent' && (
                  <span className="pro-lock-badge" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', margin: 0 }}>URGENT</span>
                )}
                {task.deadline_at && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: isOverdue ? 'var(--danger)' : 'var(--warning)' }}>
                    {isOverdue ? t('dangerZone.overdue') : t('dangerZone.due')} {new Date(task.deadline_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DangerZone
