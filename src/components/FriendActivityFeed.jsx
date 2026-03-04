import React, { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, query, where, getDocs, onSnapshot, limit } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import './FriendActivityFeed.css'

const timeAgo = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const FriendActivityFeed = () => {
  const { user, profile } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    const fetchActivities = async () => {
      try {
        // Get accepted friends
        const [sentSnap, receivedSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'friend_requests'),
            where('from', '==', user.uid),
            where('status', '==', 'accepted')
          )),
          getDocs(query(
            collection(db, 'friend_requests'),
            where('to', '==', user.uid),
            where('status', '==', 'accepted')
          ))
        ])

        const friendIds = [
          ...sentSnap.docs.map(d => d.data().to),
          ...receivedSnap.docs.map(d => d.data().from),
        ]

        if (friendIds.length === 0) {
          setActivities([])
          setLoading(false)
          return
        }

        // Chunk friend IDs into groups of 10 (Firestore 'in' limit)
        const chunks = []
        for (let i = 0; i < friendIds.length; i += 10) {
          chunks.push(friendIds.slice(i, i + 10))
        }

        // Fetch profiles for names
        const profileSnaps = await Promise.all(
          chunks.map(chunk => getDocs(query(collection(db, 'profiles'), where('id', 'in', chunk))))
        )
        const profileMap = {}
        profileSnaps.forEach(snap => snap.docs.forEach(d => { profileMap[d.id] = d.data() }))

        // Fetch recent tasks
        const taskSnaps = await Promise.all(
          chunks.map(chunk => getDocs(query(
            collection(db, 'tasks'),
            where('user_id', 'in', chunk),
            where('completed', '==', true),
            limit(20)
          )))
        )
        const recentTasks = taskSnaps.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'task' })))

        // Fetch recent sessions
        const sessionSnaps = await Promise.all(
          chunks.map(chunk => getDocs(query(
            collection(db, 'sessions'),
            where('user_id', 'in', chunk),
            where('completed', '==', true),
            limit(20)
          )))
        )
        const recentSessions = sessionSnaps.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'session' })))

        // Build activity list
        const all = [
          ...recentTasks.map(t => ({
            id: t.id,
            userId: t.user_id,
            name: profileMap[t.user_id]?.full_name || 'A friend',
            action: `completed a task`,
            detail: t.title,
            timestamp: t.updated_at,
            emoji: '✅',
          })),
          ...recentSessions.map(s => ({
            id: s.id,
            userId: s.user_id,
            name: profileMap[s.user_id]?.full_name || 'A friend',
            action: `completed a focus session`,
            detail: `${Math.round((s.duration_seconds || 0) / 60)} min`,
            timestamp: s.created_at,
            emoji: '⏱️',
          }))
        ]

        // Sort by most recent
        all.sort((a, b) => {
          const ta = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0)
          const tb = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0)
          return tb - ta
        })

        setActivities(all.slice(0, 15))
      } catch (err) {
        console.warn('FriendFeed error:', err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [user?.uid])

  if (loading) {
    return (
      <div className="friend-feed-card">
        <div className="friend-feed-header">
          <span className="friend-feed-title">👥 Friend Activity</span>
        </div>
        <div className="friend-feed-loading">
          <div className="feed-skeleton" />
          <div className="feed-skeleton short" />
          <div className="feed-skeleton" />
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="friend-feed-card">
        <div className="friend-feed-header">
          <span className="friend-feed-title">👥 Friend Activity</span>
        </div>
        <div className="friend-feed-empty">
          <span className="feed-empty-icon">🤝</span>
          <p>Add friends to see their activity here!</p>
          <p className="feed-empty-sub">Visit your Profile to send friend requests.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="friend-feed-card">
      <div className="friend-feed-header">
        <span className="friend-feed-title">👥 Friend Activity</span>
        <span className="friend-feed-count">{activities.length} recent</span>
      </div>
      <div className="friend-feed-list">
        {activities.map((act, i) => (
          <div key={act.id + i} className="feed-item">
            <div className="feed-item-avatar">
              {act.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="feed-item-body">
              <span className="feed-item-name">{act.name.split(' ')[0]}</span>
              <span className="feed-item-action"> {act.action}</span>
              {act.detail && <span className="feed-item-detail"> · {act.detail}</span>}
            </div>
            <div className="feed-item-meta">
              <span className="feed-item-emoji">{act.emoji}</span>
              <span className="feed-item-time">{timeAgo(act.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FriendActivityFeed
