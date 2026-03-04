import React, { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc
} from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import './PeopleSearch.css'

const PeopleSearch = ({ isOpen, onClose, onStartChat }) => {
  const { user, profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [friendStatuses, setFriendStatuses] = useState({}) // uid -> 'friend' | 'pending' | 'none'
  const [viewingProfile, setViewingProfile] = useState(null)

  // Load friend statuses
  useEffect(() => {
    if (!user?.uid || !isOpen) return
    const loadStatuses = async () => {
      try {
        const [sentSnap, receivedSnap, acceptedSent, acceptedReceived] = await Promise.all([
          getDocs(query(collection(db, 'friend_requests'), where('from', '==', user.uid), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'friend_requests'), where('to', '==', user.uid), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'friend_requests'), where('from', '==', user.uid), where('status', '==', 'accepted'))),
          getDocs(query(collection(db, 'friend_requests'), where('to', '==', user.uid), where('status', '==', 'accepted'))),
        ])

        const statuses = {}
        sentSnap.docs.forEach(d => { statuses[d.data().to] = 'pending' })
        receivedSnap.docs.forEach(d => { statuses[d.data().from] = 'incoming' })
        acceptedSent.docs.forEach(d => { statuses[d.data().to] = 'friend' })
        acceptedReceived.docs.forEach(d => { statuses[d.data().from] = 'friend' })
        setFriendStatuses(statuses)
      } catch (err) {
        console.warn('Status load error:', err.message)
      }
    }
    loadStatuses()
  }, [user?.uid, isOpen])

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setResults([]); return }

    const doSearch = async () => {
      setIsSearching(true)
      try {
        const term = searchQuery.toLowerCase()
        const snap = await getDocs(collection(db, 'profiles'))
        const found = snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(p => p.uid !== user?.uid && p.full_name?.toLowerCase().includes(term))
          .slice(0, 15)
        setResults(found)
      } catch (err) {
        console.warn('People search error:', err.message)
      } finally {
        setIsSearching(false)
      }
    }

    const t = setTimeout(doSearch, 350)
    return () => clearTimeout(t)
  }, [searchQuery, user?.uid])

  const sendFriendRequest = async (targetUid) => {
    try {
      await addDoc(collection(db, 'friend_requests'), {
        from: user.uid,
        from_uid: user.uid,
        to: targetUid,
        to_uid: targetUid,
        status: 'pending',
        timestamp: serverTimestamp()
      })
      setFriendStatuses(s => ({ ...s, [targetUid]: 'pending' }))
    } catch (err) {
      console.warn('Friend request error:', err.message)
    }
  }

  const viewProfile = (person) => {
    setViewingProfile(person)
  }

  const statusLabel = (uid) => {
    const s = friendStatuses[uid]
    if (s === 'friend') return { label: '✓ Friends', disabled: true, cls: 'ps-btn-friend' }
    if (s === 'pending') return { label: 'Requested', disabled: true, cls: 'ps-btn-pending' }
    if (s === 'incoming') return { label: '+ Accept', disabled: false, cls: 'ps-btn-incoming' }
    return { label: '+ Add Friend', disabled: false, cls: 'ps-btn-add' }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="ps-backdrop" onClick={onClose} />
      <div className="ps-panel">
        <div className="ps-header">
          <div className="ps-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Find People
          </div>
          <button className="ps-close" onClick={onClose}>×</button>
        </div>

        <div className="ps-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            autoFocus
            type="text"
            className="ps-search-input"
            placeholder="Search by name…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ps-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {viewingProfile ? (
          <div className="ps-profile-view">
            <button className="ps-back-btn" onClick={() => setViewingProfile(null)}>
              ← Back to results
            </button>
            <div className="ps-profile-header">
              <div className="ps-profile-avatar">
                {viewingProfile.photo_url
                  ? <img src={viewingProfile.photo_url} alt={viewingProfile.full_name} />
                  : (viewingProfile.avatar_emoji || viewingProfile.full_name?.[0]?.toUpperCase() || '?')
                }
              </div>
              <div className="ps-profile-info">
                <div className="ps-profile-name">{viewingProfile.full_name}</div>
                <div className="ps-profile-type">{viewingProfile.student_type || 'Student'}</div>
              </div>
            </div>
            <div className="ps-profile-stats">
              {viewingProfile.xp !== undefined && (
                <div className="ps-stat"><span>{viewingProfile.xp || 0}</span>XP</div>
              )}
              {viewingProfile.tasks_completed !== undefined && (
                <div className="ps-stat"><span>{viewingProfile.tasks_completed || 0}</span>Tasks</div>
              )}
              {viewingProfile.study_hours !== undefined && (
                <div className="ps-stat"><span>{viewingProfile.study_hours || 0}</span>Hours</div>
              )}
            </div>
            {viewingProfile.bio && (
              <div className="ps-profile-bio">
                <div className="ps-profile-bio-label">Bio</div>
                <p>{viewingProfile.bio}</p>
              </div>
            )}
            {viewingProfile.interests?.length > 0 && (
              <div className="ps-profile-bio">
                <div className="ps-profile-bio-label">Interests</div>
                <div className="ps-interests">
                  {viewingProfile.interests.map((i, idx) => (
                    <span key={idx} className="ps-interest-tag">{i}</span>
                  ))}
                </div>
              </div>
            )}
            {(() => {
              const s = statusLabel(viewingProfile.uid)
              return (
                <div className="ps-profile-actions">
                  <button
                    className={`ps-action-btn ${s.cls}`}
                    disabled={s.disabled}
                    onClick={() => !s.disabled && sendFriendRequest(viewingProfile.uid)}
                  >
                    {s.label}
                  </button>
                  <button
                    className="ps-action-btn ps-btn-msg"
                    onClick={() => onStartChat && onStartChat(viewingProfile)}
                  >
                    💬 Message
                  </button>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="ps-results-list">
            {!searchQuery.trim() ? (
              <div className="ps-empty">
                <span>🔍</span>
                <p>Search for someone by name to connect with them!</p>
              </div>
            ) : isSearching ? (
              <div className="ps-empty"><p>Searching…</p></div>
            ) : results.length === 0 ? (
              <div className="ps-empty"><p>No users found for "{searchQuery}"</p></div>
            ) : (
              results.map(person => {
                const s = statusLabel(person.uid)
                return (
                  <div key={person.uid} className="ps-result-row">
                    <button className="ps-result-profile" onClick={() => viewProfile(person)}>
                      <div className="ps-avatar">
                        {person.photo_url
                          ? <img src={person.photo_url} alt={person.full_name} />
                          : (person.avatar_emoji || person.full_name?.[0]?.toUpperCase() || '?')
                        }
                      </div>
                      <div className="ps-info">
                        <div className="ps-name">{person.full_name}</div>
                        <div className="ps-type">{person.student_type || 'Student'} · View Profile →</div>
                      </div>
                    </button>
                    <div className="ps-row-actions">
                      <button
                        className="ps-btn-icon"
                        title="Message"
                        onClick={() => onStartChat && onStartChat(person)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </button>
                      <button
                        className={`ps-btn ${s.cls}`}
                        disabled={s.disabled}
                        onClick={() => !s.disabled && sendFriendRequest(person.uid)}
                      >
                        {s.label}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default PeopleSearch
