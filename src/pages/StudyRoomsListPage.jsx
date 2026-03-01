import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import './StudyRoomsListPage.css'

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

const StudyRoomsListPage = ({ onNavigate, onEnterRoom }) => {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [myRooms, setMyRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [activeTab, setActiveTab] = useState('my') // 'my' | 'create' | 'join'

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Scholar'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (user) fetchMyRooms()
  }, [user])

  const fetchMyRooms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('room_members')
        .select('room_id, study_rooms(id, name, code, created_by, created_at)')
        .eq('user_id', user)
        .order('joined_at', { ascending: false })

      if (error) throw error
      setMyRooms((data || []).map(m => m.study_rooms).filter(Boolean))
    } catch (err) {
      console.error('Failed to fetch rooms:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async () => {
    if (!roomName.trim()) return
    setCreating(true)
    try {
      const code = generateCode()
      const { data: room, error: roomErr } = await supabase
        .from('study_rooms')
        .insert([{ name: roomName.trim(), code, created_by: user.id }])
        .select()
        .single()

      if (roomErr) throw roomErr

      await supabase.from('room_members').insert([{
        room_id: room.id,
        user_id: user,
        display_name: displayName
      }])

      toast(`Room "${room.name}" created! Code: ${room.code}`, 'success', 5000)
      setRoomName('')
      setActiveTab('my')
      fetchMyRooms()
      onEnterRoom(room.id, room.name)
    } catch (err) {
      toast('Failed to create room. Please try again.', 'error')
      console.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const joinRoom = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      const { data: room, error } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('code', joinCode.trim().toUpperCase())
        .single()

      if (error || !room) { toast('Room not found. Check the code and try again.', 'error'); return }

      // Check if already a member
      const { data: existing } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', room.id)
        .eq('user_id', user)
        .single()

      if (!existing) {
        await supabase.from('room_members').insert([{
          room_id: room.id,
          user_id: user.id,
          display_name: displayName
        }])
      }

      toast(`Joined "${room.name}"!`, 'success')
      setJoinCode('')
      fetchMyRooms()
      onEnterRoom(room.id, room.name)
    } catch (err) {
      toast('Something went wrong. Try again.', 'error')
      console.error(err.message)
    } finally {
      setJoining(false)
    }
  }

  const leaveRoom = async (roomId, e) => {
    e.stopPropagation()
    try {
      await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', user.id)
      setMyRooms(prev => prev.filter(r => r.id !== roomId))
      toast('Left the room.', 'success')
    } catch (err) {
      console.error(err.message)
    }
  }

  return (
    <div className="canvas-layout">
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>NN.</div>
            <h1 className="text-xl font-serif text-muted italic ml-4 pl-4" style={{ borderLeft: '1px solid var(--border)' }}>Study Rooms</h1>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="rooms-main container">
        {/* Tabs */}
        <div className="rooms-tabs">
          <button className={`rooms-tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My Rooms</button>
          <button className={`rooms-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>+ Create</button>
          <button className={`rooms-tab ${activeTab === 'join' ? 'active' : ''}`} onClick={() => setActiveTab('join')}>Join Room</button>
        </div>

        {/* My Rooms Tab */}
        {activeTab === 'my' && (
          <div className="rooms-list-section">
            {loading ? (
              <div className="rooms-loading">
                <div className="skeleton" style={{ height: '80px', marginBottom: '1rem' }} />
                <div className="skeleton" style={{ height: '80px', marginBottom: '1rem' }} />
              </div>
            ) : myRooms.length === 0 ? (
              <div className="rooms-empty">
                <div className="rooms-empty-icon">📚</div>
                <p className="font-serif italic text-lg">No rooms yet.</p>
                <p className="text-xs text-muted mt-1 uppercase tracking-widest">Create or join a room to study together.</p>
                <div className="flex gap-4 mt-6 justify-center">
                  <button className="rooms-cta-btn" onClick={() => setActiveTab('create')}>Create Room</button>
                  <button className="rooms-cta-btn rooms-cta-btn--outline" onClick={() => setActiveTab('join')}>Join Room</button>
                </div>
              </div>
            ) : (
              <div className="rooms-grid">
                {myRooms.map(room => (
                  <div key={room.id} className="room-card" onClick={() => onEnterRoom(room.id, room.name)}>
                    <div className="room-card-header">
                      <div className="room-card-icon">📖</div>
                      <div className="room-card-name">{room.name}</div>
                    </div>
                    <div className="room-card-code">
                      <span className="text-xs text-muted uppercase tracking-widest">Code</span>
                      <span className="room-code-chip">{room.code}</span>
                    </div>
                    <div className="room-card-footer">
                      <button className="room-enter-btn">Enter →</button>
                      <button className="room-leave-btn" onClick={(e) => leaveRoom(room.id, e)}>Leave</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="rooms-form-section">
            <h2 className="font-serif text-2xl text-primary mb-2">Create a Study Room</h2>
            <p className="text-muted text-sm mb-6">Give your room a name and share the code with classmates.</p>
            <div className="rooms-form">
              <input
                type="text"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createRoom()}
                placeholder="e.g. Physics Finals 2026"
                className="rooms-input"
                autoFocus
                maxLength={50}
              />
              <button
                onClick={createRoom}
                disabled={creating || !roomName.trim()}
                className="rooms-submit-btn"
              >
                {creating ? 'Creating…' : 'Create Room'}
              </button>
            </div>
          </div>
        )}

        {/* Join Tab */}
        {activeTab === 'join' && (
          <div className="rooms-form-section">
            <h2 className="font-serif text-2xl text-primary mb-2">Join a Study Room</h2>
            <p className="text-muted text-sm mb-6">Enter the 6-character invite code from your classmate.</p>
            <div className="rooms-form">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
                placeholder="e.g. NX72K1"
                className="rooms-input rooms-input--code"
                autoFocus
                maxLength={6}
              />
              <button
                onClick={joinRoom}
                disabled={joining || joinCode.length !== 6}
                className="rooms-submit-btn"
              >
                {joining ? 'Joining…' : 'Join Room'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default StudyRoomsListPage
