import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTimer } from '../contexts/TimerContext'
import { useZen } from '../contexts/ZenContext'
import { useToast } from '../contexts/ToastContext'
import { getArchetype } from '../constants/archetypes'
import { getZenTrack } from '../constants/zenTracks'
import SharedWhiteboard from '../components/study/SharedWhiteboard'
import './StudyRoomPage.css'

// Mini timer ring SVG for each member
const MiniTimerRing = ({ status, secondsLeft, isZen }) => {
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const color = isZen ? 'var(--primary)' : status === 'focusing' ? 'var(--success)' : 'var(--text-secondary)'
  
  return (
    <div className="mini-timer-wrap">
      <div className="mini-timer-text" style={{ color }}>
        {status === 'focusing' ? formatTime(secondsLeft) : status === 'done' ? 'DONE' : 'IDLE'}
      </div>
      {isZen && <span className="zen-mini-tag">ZEN</span>}
    </div>
  )
}

const StudyRoomPage = ({ roomId, roomName, onNavigate, onBack }) => {
  const { user, profile } = useAuth()
  const { secondsLeft, isRunning, isComplete } = useTimer()
  const { isZenModeActive, activeTrackId } = useZen()
  const toast = useToast()
  const channelRef = useRef(null)

  // Members presence
  const [members, setMembers] = useState([])
  const [nudgedMemberId, setNudgedMemberId] = useState(null)
  
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

  const displayName = profile?.full_name || 'Scholar'

  // ── Fetch room code ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('study_rooms')
      .select('code')
      .eq('id', roomId)
      .single()
      .then(({ data }) => { if (data) setRoomCode(data.code) })
  }, [roomId])

  // ── Supabase Realtime Presence ───────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: user?.id } }
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
      .on('broadcast', { event: 'nudge' }, (payload) => {
        if (payload.payload.target_id === user?.id) {
          handleReceivedNudge(payload.payload.from_name)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user?.id,
            display_name: displayName,
            avatar_id: profile?.avatar_id || 'owl',
            timer_status: isRunning ? 'focusing' : isComplete ? 'done' : 'idle',
            seconds_left: secondsLeft,
            is_zen: isZenModeActive,
            active_track_id: activeTrackId,
            online_at: new Date().toISOString(),
          })
        }
      })

    channelRef.current = channel

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [roomId, user?.id, displayName, isRunning, isComplete, secondsLeft, isZenModeActive, activeTrackId, profile?.avatar_id])

  // ── Sync local status to presence ───────────────────────────────────────
  useEffect(() => {
    if (channelRef.current && user?.id) {
      channelRef.current.track({
        user_id: user?.id,
        user_name: profile?.full_name || 'Anonymous Scholar',
        avatar_id: profile?.avatar_id || 'owl',
        seconds_left: secondsLeft,
        is_zen: isZenModeActive,
        active_track_id: activeTrackId,
        timer_status: isRunning ? 'focusing' : (isComplete ? 'finished' : 'idle'),
        online_at: new Date().toISOString(),
      })
    }
  }, [isRunning, isComplete, secondsLeft, isZenModeActive, activeTrackId, user?.id, displayName, profile?.avatar_id])

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

  const addTask = async () => {
    if (!newTask.trim()) return
    setAddingTask(true)
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
          created_by: guestId,
          title: taskObj.title,
        }
      ]).select()
      if (error) throw error
      if (data && data[0]) {
        setTasks(prev => prev.map(t => t.id === tempId ? data[0] : t))
      }
    } catch {
      toast('Failed to add task.', 'error')
      setTasks(prev => prev.filter(t => t.id !== tempId))
    } finally {
      setAddingTask(false)
    }
  }

  const toggleTask = async (task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    try {
      const { error } = await supabase.from('room_tasks').update({ completed: !task.completed }).eq('id', task.id)
      if (error) throw error
    } catch {
      toast('Failed to update task.', 'error')
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t))
    }
  }

  const deleteTask = async (id) => {
    const taskToDelete = tasks.find(t => t.id === id)
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      const { error } = await supabase.from('room_tasks').delete().eq('id', id)
      if (error) throw error
    } catch {
      toast('Failed to delete task.', 'error')
      if (taskToDelete) setTasks(prev => [...prev, taskToDelete])
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast(`Code "${roomCode}" copied! Share it with classmates.`, 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const incompletes = tasks.filter(t => !t.completed)
  const completes   = tasks.filter(t => t.completed)

  // ── Calculate Group Momentum ─────────────────────────────────────────────
  const groupMomentum = React.useMemo(() => {
    if (members.length === 0) return 0
    const focusing = members.filter(m => m.timer_status === 'focusing').length
    return Math.round((focusing / members.length) * 100)
  }, [members])

  const sendChat = () => {
    if (!chatInput.trim() || !channelRef.current) return
    const msg = {
      id: crypto.randomUUID(),
      user_id: guestId,
      display_name: displayName,
      text: chatInput.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    setChatInput('')
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: msg
    })
  }

  const broadcastEmote = (emoji) => {
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
    const startX = 10 + Math.random() * 80
    setActiveEmotes(prev => [...prev, { id, emoji, startX }])
    setTimeout(() => {
      setActiveEmotes(prev => prev.filter(e => e.id !== id))
    }, 3000)
  }

  const sendNudge = (targetMember) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'nudge',
      payload: { 
        target_id: targetMember.user_id,
        from_name: displayName
      }
    })
    toast(`Nudged ${targetMember.display_name}! 🔔`, 'success')
  }

  const handleReceivedNudge = (fromName) => {
    setNudgedMemberId('me')
    toast(`${fromName} nudged you! Stay focused! 🔔`, 'info')
    setTimeout(() => setNudgedMemberId(null), 2000)
  }

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const EMOTES = ['🔥', '💯', '🧠', '☕', '💡', '🚀']

  return (
    <>
      <div className="canvas-layout">
        <div className="momentum-container">
          <div className="momentum-fill" style={{ width: `${groupMomentum}%` }} />
          <div className="momentum-glow" />
        </div>

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

        <header className="canvas-header container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-ink pb-4 pt-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>NN.</div>
              <div className="sm:ml-4 sm:pl-4 border-l-0 sm:border-l border-border">
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

              <div className="sm:ml-4 sm:pl-4 flex items-center gap-3 border-l-0 sm:border-l border-border mt-2 sm:mt-0">
                <button
                  onClick={() => setShowWhiteboard(true)}
                  className="open-whiteboard-btn"
                >
                  <span>🎨</span> Open Whiteboard
                </button>
              </div>
            </div>
            <button onClick={onBack} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer self-start md:self-auto">
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
                {members.map(m => {
                  const arche = getArchetype(m.avatar_id)
                  const isMe = m.user_id === guestId
                  const isNudged = (isMe && nudgedMemberId === 'me') || (!isMe && nudgedMemberId === m.user_id)
                  const currentTrack = m.is_zen ? getZenTrack(m.active_track_id) : null

                  return (
                    <div key={m.user_id} className={`member-card ${isMe ? 'member-card--you' : ''} ${m.is_zen ? 'member-card--zen' : ''} ${isNudged ? 'member-card--nudged' : ''} member-card--${m.timer_status || 'idle'}`}>
                      <div className="member-avatar-container">
                        <div className="member-avatar">
                          {arche.emoji}
                        </div>
                      </div>

                      <div className="member-info">
                        <div className="member-name-row">
                          <div className="member-name text-xs sm:text-sm font-bold truncate pr-1">
                            {m.display_name || 'Scholar'} {isMe && <span className="member-you-tag">you</span>}
                          </div>
                          {!isMe && (
                            <button className="nudge-btn" onClick={() => sendNudge(m)} title="Nudge">🔔</button>
                          )}
                        </div>
                        <div className="member-status-row">
                          <MiniTimerRing 
                            status={m.timer_status || 'idle'} 
                            secondsLeft={m.seconds_left}
                            isZen={m.is_zen}
                          />
                        </div>
                        {currentTrack && (
                          <div className="member-music">
                            <span className="music-icon">🎵</span> {currentTrack.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CENTER — Shared Tasks */}
            <div className="room-panel room-panel--tasks">
              <div className="room-panel-title">📋 Shared Tasks</div>
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
              <div className="room-tasks-list">
                {incompletes.map(task => (
                  <div key={task.id} className="room-task-item">
                    <button className="room-task-check" onClick={() => toggleTask(task)} />
                    <span className="room-task-title">{task.title}</span>
                    <button className="room-task-delete" onClick={() => deleteTask(task.id)}>×</button>
                  </div>
                ))}
                {completes.length > 0 && (
                  <>
                    <div className="room-tasks-divider">Done ({completes.length})</div>
                    {completes.map(task => (
                      <div key={task.id} className="room-task-item room-task-item--done room-task-sparkle">
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
                {messages.map(msg => {
                  const isMe = msg.user_id === guestId
                  return (
                    <div key={msg.id} className={`chat-msg-row ${isMe ? 'chat-msg-row--you' : ''}`}>
                      {!isMe && <div className="chat-msg-avatar">{(msg.display_name || 'U')[0].toUpperCase()}</div>}
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
                    <button key={emoji} className="emote-btn" onClick={() => broadcastEmote(emoji)}>{emoji}</button>
                  ))}
                </div>
                <div className="chat-input-pill mt-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Message..."
                    className="chat-input"
                  />
                  <button onClick={sendChat} disabled={!chatInput.trim()} className="chat-send-btn">➤</button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {showWhiteboard && (
        <div className="whiteboard-overlay-backdrop">
           <div className="whiteboard-overlay-container">
              <SharedWhiteboard 
                channel={channelRef.current} 
                user={{ id: guestId, ...guestProfile }} 
                onClose={() => setShowWhiteboard(false)} 
              />
           </div>
        </div>
      )}
    </>
  )
}

export default StudyRoomPage
