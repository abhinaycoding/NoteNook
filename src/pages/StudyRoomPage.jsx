import React, { useState, useEffect, useRef } from 'react'
import { db } from '../lib/firebase'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore'
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

  const [members, setMembers] = useState([])
  const [nudgedMemberId, setNudgedMemberId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [activeEmotes, setActiveEmotes] = useState([])
  const chatBottomRef = useRef(null)

  const displayName = profile?.full_name || 'Scholar'

  // 1. Fetch Room Code
  useEffect(() => {
    if (!roomId) return
    const unsubscribe = onSnapshot(doc(db, 'study_rooms', roomId), (snap) => {
      if (snap.exists()) setRoomCode(snap.data().code)
    })
    return () => unsubscribe()
  }, [roomId])

  // 2. Presence Heartbeat & Membership Sync
  useEffect(() => {
    if (!user?.uid || !roomId) return

    // Update presence every 30 seconds
    const updatePresence = async () => {
      const q = query(
        collection(db, 'room_members'), 
        where('room_id', '==', roomId),
        where('user_id', '==', user.uid)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        await updateDoc(doc(db, 'room_members', snap.docs[0].id), {
          display_name: displayName,
          avatar_id: profile?.avatar_id || 'owl',
          timer_status: isRunning ? 'focusing' : isComplete ? 'done' : 'idle',
          seconds_left: secondsLeft,
          is_zen: isZenModeActive,
          active_track_id: activeTrackId || null,
          last_seen: serverTimestamp()
        })
      }
    }

    updatePresence()
    const interval = setInterval(updatePresence, 30000)

    // Listen to all members
    const q = query(collection(db, 'room_members'), where('room_id', '==', roomId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now()
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Filter out members who haven't been seen in 2 minutes
      setMembers(list.filter(m => {
        const lastSeen = m.last_seen?.toDate ? m.last_seen.toDate().getTime() : now
        return (now - lastSeen) < 120000
      }))
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [roomId, user?.uid, isRunning, isComplete, secondsLeft, isZenModeActive, activeTrackId, displayName, profile?.avatar_id])

  // 3. Shared Tasks
  useEffect(() => {
    if (!roomId) return
    const q = query(collection(db, 'room_tasks'), where('room_id', '==', roomId), orderBy('created_at', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [roomId])

  // 4. Chat Messages
  useEffect(() => {
    if (!roomId) return
    const q = query(
      collection(db, 'room_messages'), 
      where('room_id', '==', roomId), 
      orderBy('created_at', 'asc'),
      limit(50)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsubscribe()
  }, [roomId])

  // 5. Ephemeral Events (Nudges, Emotes)
  useEffect(() => {
    if (!roomId || !user?.uid) return
    const q = query(
      collection(db, 'room_events'), 
      where('room_id', '==', roomId),
      where('created_at', '>', new Date(Date.now() - 5000)), // Only last 5 seconds
      orderBy('created_at', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const event = change.doc.data()
          if (event.type === 'emote') triggerEmote(event.emoji)
          if (event.type === 'nudge' && event.target_id === user.uid) {
            handleReceivedNudge(event.from_name)
          }
        }
      })
    })
    return () => unsubscribe()
  }, [roomId, user?.uid])

  const addTask = async () => {
    if (!newTask.trim() || !user?.uid) return
    setAddingTask(true)
    try {
      await addDoc(collection(db, 'room_tasks'), {
        room_id: roomId,
        created_by: user.uid,
        title: newTask.trim(),
        completed: false,
        created_at: serverTimestamp()
      })
      setNewTask('')
    } catch (err) {
      toast('Failed to add task.', 'error')
    } finally {
      setAddingTask(false)
    }
  }

  const toggleTask = async (task) => {
    try {
      await updateDoc(doc(db, 'room_tasks', task.id), { completed: !task.completed })
    } catch (err) {
      toast('Failed to update task.', 'error')
    }
  }

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'room_tasks', id))
    } catch (err) {
      toast('Failed to delete task.', 'error')
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || !user?.uid) return
    const text = chatInput.trim()
    setChatInput('')
    try {
      await addDoc(collection(db, 'room_messages'), {
        room_id: roomId,
        user_id: user.uid,
        display_name: displayName,
        text,
        created_at: serverTimestamp(),
      })
    } catch (err) {
      console.error(err)
    }
  }

  const broadcastEmote = async (emoji) => {
    triggerEmote(emoji)
    try {
      await addDoc(collection(db, 'room_events'), {
        room_id: roomId,
        type: 'emote',
        emoji,
        user_id: user.uid,
        created_at: serverTimestamp()
      })
    } catch (err) { /* ignore */ }
  }

  const sendNudge = async (targetMember) => {
    try {
      await addDoc(collection(db, 'room_events'), {
        room_id: roomId,
        type: 'nudge',
        target_id: targetMember.user_id,
        from_name: displayName,
        created_at: serverTimestamp()
      })
      toast(`Nudged ${targetMember.display_name}! 🔔`, 'success')
    } catch (err) { /* ignore */ }
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

        <header className="canvas-header container">
          <div className="flex justify-between items-center border-b border-ink pb-6">
            <div className="flex items-center gap-4 overflow-hidden">
              <div
                className="logo-mark font-serif text-3xl sm:text-4xl text-primary cursor-pointer flex-shrink-0"
                onClick={onBack}
              >
                NN.
              </div>
              <div className="flex flex-col ml-2 overflow-hidden">
                <h1 className="text-base sm:text-xl font-serif text-muted italic truncate">{roomName}</h1>
                <button
                  onClick={() => setShowWhiteboard(true)}
                  className="open-whiteboard-btn"
                  style={{ marginTop: '0.25rem' }}
                >
                  <span>🎨</span> Open Whiteboard
                </button>
              </div>
            </div>
            <button onClick={onBack} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer self-center">
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
