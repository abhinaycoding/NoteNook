import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import SharedWhiteboard from '../components/study/SharedWhiteboard'
import './StudyRoomPage.css'

// Mini timer ring SVG for each member
const MiniTimerRing = ({ status }) => {
  const emoji = status === 'focusing' ? '🟢' : status === 'done' ? '✅' : '⏸'
  return <span className="member-status-emoji" title={status}>{emoji}</span>
}

const StudyRoomPage = ({ roomId, roomName, onNavigate, onBack }) => {
  const { user, profile } = useAuth()
  const toast = useToast()
  const channelRef = useRef(null)

  // Members presence
  const [members, setMembers] = useState([])

  // Shared tasks
  const [tasks, setTasks]     = useState([])
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  
  // Whiteboard Modal
  const [showWhiteboard, setShowWhiteboard] = useState(false)

  // Room info
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)

  // Chat & Emotes
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [activeEmotes, setActiveEmotes] = useState([])
  const chatBottomRef = useRef(null)

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Scholar'

  // ── Fetch room code ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('study_rooms')
      .select('code')
      .eq('id', roomId)
      .single()
      .then(({ data }) => { if (data) setRoomCode(data.code) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // ── Supabase Realtime Presence ───────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: user.id } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const list = Object.values(state).map(arr => arr[0]).filter(Boolean)
        setMembers(list)
      })
      .on('broadcast', { event: 'chat' }, (payload) => {
        setMessages(prev => [...prev, payload.payload])
      })
      .on('broadcast', { event: 'emote' }, (payload) => {
        triggerEmote(payload.payload.emoji)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            display_name: displayName,
            timer_status: 'idle',
            online_at: new Date().toISOString(),
          })
        }
      })

    channelRef.current = channel

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user.id])

  // ── Fetch & subscribe to shared tasks ───────────────────────────────────
  useEffect(() => {
    supabase
      .from('room_tasks')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setTasks(data || []))

    const sub = supabase
      .channel(`room_tasks:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_tasks',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [roomId])

  // ── Shared task actions ──────────────────────────────────────────────────
  const addTask = async () => {
    if (!newTask.trim()) return
    setAddingTask(true)
    
    // Optimistic UI Update
    const tempId = crypto.randomUUID()
    const taskObj = {
      id: tempId,
      room_id: roomId,
      created_by: user.id,
      title: newTask.trim(),
      completed: false,
      created_at: new Date().toISOString()
    }
    setTasks(prev => [...prev, taskObj])
    setNewTask('')

    try {
      const { data, error } = await supabase.from('room_tasks').insert([
        {
          room_id: roomId,
          created_by: user.id,
          title: taskObj.title,
        }
      ]).select()

      if (error) throw error
      
      // Replace temp ID with real DB ID
      if (data && data[0]) {
        setTasks(prev => prev.map(t => t.id === tempId ? data[0] : t))
      }
    } catch {
      toast('Failed to add task.', 'error')
      // Revert optimistic update on failure
      setTasks(prev => prev.filter(t => t.id !== tempId))
    } finally {
      setAddingTask(false)
    }
  }

  const toggleTask = async (task) => {
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    try {
      const { error } = await supabase.from('room_tasks').update({ completed: !task.completed }).eq('id', task.id)
      if (error) throw error
    } catch {
      toast('Failed to update task.', 'error')
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t))
    }
  }

  const deleteTask = async (id) => {
    // Need to save the task in case we need to revert
    const taskToDelete = tasks.find(t => t.id === id)
    
    // Optimistic Update
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      const { error } = await supabase.from('room_tasks').delete().eq('id', id)
      if (error) throw error
    } catch {
      toast('Failed to delete task.', 'error')
      // Revert on failure
      if (taskToDelete) setTasks(prev => [...prev, taskToDelete])
    }
  }

  // ── Copy invite code ─────────────────────────────────────────────────────
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast(`Code "${roomCode}" copied! Share it with classmates.`, 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const incomplete = tasks.filter(t => !t.completed)
  const complete   = tasks.filter(t => t.completed)

  // ── Chat & Emotes Actions ────────────────────────────────────────────────
  const sendChat = () => {
    if (!chatInput.trim() || !channelRef.current) return
    const msg = {
      id: crypto.randomUUID(),
      user_id: user.id,
      display_name: displayName,
      text: chatInput.trim(),
      created_at: new Date().toISOString(),
    }
    // Optimistic UI update
    setMessages(prev => [...prev, msg])
    setChatInput('')
    
    // Broadcast to room
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: msg
    })
  }

  const broadcastEmote = (emoji) => {
    // Show locally first
    triggerEmote(emoji)
    
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'emote',
        payload: { emoji, user_id: user.id }
      })
    }
  }

  const triggerEmote = (emoji) => {
    const id = crypto.randomUUID()
    // Randomize starting X position between 10% and 90% of screen width
    const startX = 10 + Math.random() * 80
    
    setActiveEmotes(prev => [...prev, { id, emoji, startX }])
    
    // Remove after 3 seconds (duration of CSS animation)
    setTimeout(() => {
      setActiveEmotes(prev => prev.filter(e => e.id !== id))
    }, 3000)
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const EMOTES = ['🔥', '💯', '🧠', '☕', '💡', '🚀']

  return (
    <>
      <div className="canvas-layout">
        {/* Floating Emotes Layer */}
      <div className="floating-emote-layer">
        {activeEmotes.map(emote => (
          <div 
            key={emote.id} 
            className="floating-emote"
            style={{ left: `${emote.startX}%` }}
          >
            {emote.emoji}
          </div>
        ))}
      </div>
      {/* Header */}
      <header className="canvas-header container max-w-7xl mx-auto">
        <div className="flex justify-between items-end border-b border-ink pb-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>NN.</div>
            <div className="ml-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>
              <h1 className="text-xl font-serif text-primary">{roomName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted uppercase tracking-widest">Code:</span>
                <button
                  className={`room-code-badge ${copied ? 'room-code-badge--copied' : ''}`}
                  onClick={copyCode}
                  title="Click to copy"
                >
                  {roomCode} {copied ? '✓' : '⎘'}
                </button>
              </div>
            </div>
            
            <div className="ml-4 pl-4 flex items-center" style={{ borderLeft: '1px solid var(--border)' }}>
               <button
                 onClick={() => setShowWhiteboard(true)}
                 className="open-whiteboard-btn"
               >
                 <span>🎨</span> Open Whiteboard
               </button>
            </div>
          </div>
          <button onClick={onBack} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">
            ← Rooms
          </button>
        </div>
      </header>

      <main className="room-main container max-w-7xl mx-auto">
        <div className="room-layout">

          {/* LEFT — Members Panel */}
          <div className="room-panel room-panel--members">
            <div className="room-panel-title">
              <span className="live-dot" /> Live Members ({members.length})
            </div>
            <div className="members-list">
              {members.length === 0 && (
                <p className="text-xs text-muted italic">Waiting for classmates…</p>
              )}
              {members.map(m => (
                <div key={m.user_id} className={`member-card ${m.user_id === user.id ? 'member-card--you' : ''}`}>
                  <div className="member-avatar">
                    {(m.display_name || 'S')[0].toUpperCase()}
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {m.display_name || 'Scholar'} {m.user_id === user.id && <span className="member-you-tag">you</span>}
                    </div>
                    <div className="member-status-row">
                      <MiniTimerRing status={m.timer_status || 'idle'} />
                      <span className="member-status-label">{m.timer_status === 'focusing' ? 'Focusing' : m.timer_status === 'done' ? 'Done!' : 'Idle'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Update own timer status */}
            <div className="my-status-controls">
              <div className="text-xs text-muted uppercase tracking-widest mb-2">My Status</div>
              <div className="status-btn-row">
                {['focusing', 'idle', 'done'].map(s => (
                  <button
                    key={s}
                    className={`status-btn status-btn--${s}`}
                    onClick={() => channelRef.current?.track({ user_id: user.id, display_name: displayName, timer_status: s })}
                  >
                    {s === 'focusing' ? '🟢' : s === 'done' ? '✅' : '⏸'} {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER — Shared Tasks */}
          <div className="room-panel room-panel--tasks">
            <div className="room-panel-title">📋 Shared Tasks</div>

            {/* Add task */}
            <div className="room-add-task">
              <input
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Add a shared task…"
                className="room-task-input"
              />
              <button onClick={addTask} disabled={addingTask || !newTask.trim()} className="room-task-add-btn">
                {addingTask ? '…' : '+'}
              </button>
            </div>

            {/* Incomplete tasks */}
            {incomplete.length === 0 && complete.length === 0 && (
              <p className="text-xs text-muted italic mt-4">No tasks yet. Add one above!</p>
            )}
            <div className="room-tasks-list">
              {incomplete.map(task => (
                <div key={task.id} className="room-task-item">
                  <button className="room-task-check" onClick={() => toggleTask(task)} />
                  <span className="room-task-title">{task.title}</span>
                  <button className="room-task-delete" onClick={() => deleteTask(task.id)}>×</button>
                </div>
              ))}
              {complete.length > 0 && (
                <>
                  <div className="room-tasks-divider">Done ({complete.length})</div>
                  {complete.map(task => (
                    <div key={task.id} className="room-task-item room-task-item--done">
                      <button className="room-task-check room-task-check--done" onClick={() => toggleTask(task)}>✓</button>
                      <span className="room-task-title">{task.title}</span>
                      <button className="room-task-delete" onClick={() => deleteTask(task.id)}>×</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* RIGHT — Chat & Emotes */}
          <div className="room-panel room-panel--chat">
            <div className="room-panel-title">💬 Live Chat</div>
            
            <div className="chat-messages">
              {messages.length === 0 && (
                <p className="text-xs text-muted italic text-center mt-4">No messages yet. Say hi!</p>
              )}
              {messages.map(msg => {
                const isMe = msg.user_id === user.id
                return (
                  <div key={msg.id} className={`chat-msg-row ${isMe ? 'chat-msg-row--you' : ''}`}>
                    {!isMe && (
                      <div className="chat-msg-avatar">
                        {(msg.display_name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className={`chat-msg ${isMe ? 'chat-msg--you' : ''}`}>
                      {!isMe && <span className="chat-msg-author">{msg.display_name}</span>}
                      <div className="chat-msg-bubble">{msg.text}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={chatBottomRef} />
            </div>

            <div className="chat-controls">
              <div className="emote-bar">
                {EMOTES.map(emoji => (
                  <button 
                    key={emoji} 
                    className="emote-btn" 
                    onClick={() => broadcastEmote(emoji)}
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="chat-input-pill mt-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Message the room..."
                  className="chat-input"
                  maxLength={100}
                />
                <button onClick={sendChat} disabled={!chatInput.trim()} className="chat-send-btn">
                  ➤
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
      </div> {/* End canvas-layout */}

      {/* Full Screen Whiteboard Overlay */}
      {showWhiteboard && (
        <div className="whiteboard-overlay-backdrop">
           <div className="whiteboard-overlay-container">
              <SharedWhiteboard 
                channel={channelRef.current} 
                user={user} 
                onClose={() => setShowWhiteboard(false)} 
              />
           </div>
        </div>
      )}
    </>
  )
}

export default StudyRoomPage
