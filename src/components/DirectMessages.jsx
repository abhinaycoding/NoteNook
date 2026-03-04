import React, { useState, useEffect, useRef } from 'react'
import { db } from '../lib/firebase'
import {
  collection, query, where, getDocs, onSnapshot,
  addDoc, setDoc, doc, getDoc, serverTimestamp, orderBy
} from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import './DirectMessages.css'

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: deterministic conversation ID — always sorted alphabetically so both
// sides of the conversation produce the same key: "uid1_uid2"
// ─────────────────────────────────────────────────────────────────────────────
const getConvoId = (uid1, uid2) => [uid1, uid2].sort().join('_')

const DirectMessages = ({ isOpen, onClose, onUnreadChange, initialFriend }) => {
  const { user, profile } = useAuth()
  const { isPro } = usePlan()

  const [conversations, setConversations] = useState([])  // [{uid, profile, convoId, lastMsg, lastTime, unread}]
  const [unreadSet, setUnreadSet]         = useState(new Set()) // set of convoIds
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [messages, setMessages]           = useState([])
  const [newMsg, setNewMsg]               = useState('')
  const [sending, setSending]             = useState(false)
  const [isFriendTyping, setIsFriendTyping] = useState(false)

  const messagesEndRef   = useRef(null)
  const unsubMsgsRef     = useRef(null)
  const unsubConvoRef    = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef     = useRef(null)

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-select a friend when passed in from PeopleSearch
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && initialFriend && initialFriend.uid !== selectedFriend?.uid) {
      setSelectedFriend(initialFriend)
    }
  }, [isOpen, initialFriend])

  // ─────────────────────────────────────────────────────────────────────────
  // CONVERSATION LIST — Instagram-style:
  //   1. Query /dms where participants array-contains our UID → finds ALL
  //      conversations (both sent & received) regardless of friend status
  //   2. Query /unread_dms to track which convoIds have unseen messages
  //   3. Also merge accepted friends who have no message history yet
  //   The list refreshes in real-time via a listener on unread_dms (cheap),
  //   while dms are polled each time the panel opens.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid || !isOpen) return
    let active = true

    const loadConversations = async () => {
      try {
        // ── Step 1: All dms conversations where I am a participant ──────────
        const dmsSnap = await getDocs(
          query(collection(db, 'dms'), where('participants', 'array-contains', user.uid))
        )
        const convoUids = [] // other-user UIDs from real conversations
        const convoMeta = {} // otherUid → { convoId, lastTime }
        dmsSnap.docs.forEach(d => {
          const data = d.data()
          const otherUid = (data.participants || []).find(p => p !== user.uid)
          if (otherUid) {
            convoUids.push(otherUid)
            convoMeta[otherUid] = {
              convoId:  d.id,
              lastTime: data.last_activity?.toMillis?.() || 0,
            }
          }
        })

        // ── Step 2: Accepted friends (so they appear even before first message) ──
        const [s1, s2, s3, s4] = await Promise.all([
          getDocs(query(collection(db, 'friend_requests'), where('from_uid', '==', user.uid), where('status', '==', 'accepted'))),
          getDocs(query(collection(db, 'friend_requests'), where('to_uid',   '==', user.uid), where('status', '==', 'accepted'))),
          getDocs(query(collection(db, 'friend_requests'), where('from',     '==', user.uid), where('status', '==', 'accepted'))),
          getDocs(query(collection(db, 'friend_requests'), where('to',       '==', user.uid), where('status', '==', 'accepted'))),
        ])
        const friendUids = [
          ...s1.docs.map(d => d.data().to_uid   || d.id.split('_').find(id => id !== user.uid)),
          ...s2.docs.map(d => d.data().from_uid  || d.id.split('_').find(id => id !== user.uid)),
          ...s3.docs.map(d => d.data().to        || d.id.split('_').find(id => id !== user.uid)),
          ...s4.docs.map(d => d.data().from      || d.id.split('_').find(id => id !== user.uid)),
        ].filter(id => !!id && id !== user.uid)

        // ── Step 3: Merge, deduplicate, sort by last activity ──────────────
        const allUids = [...new Set([...convoUids, ...friendUids])]
        if (!active || allUids.length === 0) { setConversations([]); return }

        // Fetch profiles for all involved users
        const profileSnaps = await Promise.all(
          allUids.map(uid => getDoc(doc(db, 'profiles', uid)))
        )

        // ── Step 4: Fetch last message text for each conversation ──────────
        const lastMsgMap = {}
        await Promise.all(convoUids.map(async uid => {
          const convoId = convoMeta[uid]?.convoId || getConvoId(user.uid, uid)
          try {
            const snap = await getDocs(
              query(collection(db, 'dms', convoId, 'messages'), orderBy('timestamp', 'desc'))
            )
            if (!snap.empty) {
              const msg = snap.docs[0].data()
              lastMsgMap[uid] = {
                text:   msg.image_url ? '📷 Image' : (msg.text || ''),
                time:   msg.timestamp?.toMillis?.() || 0,
                fromMe: msg.from === user.uid,
              }
            }
          } catch (_) {}
        }))

        const items = profileSnaps
          .filter(s => s.exists())
          .map(s => ({
            uid:     s.id,
            profile: s.data(),
            convoId: convoMeta[s.id]?.convoId || getConvoId(user.uid, s.id),
            lastMsg: lastMsgMap[s.id] || null,
            lastTime: convoMeta[s.id]?.lastTime || 0,
          }))

        // Sort: most recent first, then alphabetically
        items.sort((a, b) =>
          (b.lastTime || 0) - (a.lastTime || 0) ||
          (a.profile?.full_name?.localeCompare(b.profile?.full_name) ?? 0)
        )

        if (active) setConversations(items)
      } catch (err) {
        console.warn('DM: conversation list error —', err.message)
      }
    }

    loadConversations()

    // ── Unread badge tracker (real-time listener on cheaply updated subcollection) ──
    const unsubUnread = onSnapshot(
      collection(db, 'profiles', user.uid, 'unread_dms'),
      (snap) => {
        const unreadConvoIds = snap.docs.filter(d => d.data().unread).map(d => d.id)
        setUnreadSet(new Set(unreadConvoIds))
        if (onUnreadChange) onUnreadChange(unreadConvoIds.length > 0)

        // Re-load conversation list whenever unread state changes (catches newly received DMs)
        loadConversations()
      },
      (err) => console.warn('DM: unread listener error —', err.message)
    )

    return () => { active = false; unsubUnread() }
  }, [user?.uid, isOpen])

  // ─────────────────────────────────────────────────────────────────────────
  // OPEN A CONVERSATION — Listen to messages + typing indicator.
  //
  // ⚡ No orderBy in the messages query — Firestore silently drops documents
  //    with a pending serverTimestamp (null). We sort on the client instead
  //    so freshly sent messages are always visible immediately.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedFriend || !user?.uid) return

    if (unsubMsgsRef.current)  unsubMsgsRef.current()
    if (unsubConvoRef.current) unsubConvoRef.current()

    const convoId = getConvoId(user.uid, selectedFriend.uid)

    // Mark conversation as read when opened
    if (isOpen) {
      setDoc(
        doc(db, 'profiles', user.uid, 'unread_dms', convoId),
        { unread: false, touched: serverTimestamp() },
        { merge: true }
      ).catch(() => {})
    }

    // Real-time message listener (no server-side orderBy — sort on client)
    unsubMsgsRef.current = onSnapshot(
      collection(db, 'dms', convoId, 'messages'),
      (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        // Null/pending timestamps sort to "now" so they appear at the bottom
        msgs.sort((a, b) => {
          const ta = a.timestamp?.toMillis?.() ?? Date.now()
          const tb = b.timestamp?.toMillis?.() ?? Date.now()
          return ta - tb
        })
        setMessages(msgs)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

        // Auto-mark read if this chat is open when messages arrive
        if (isOpen) {
          setDoc(
            doc(db, 'profiles', user.uid, 'unread_dms', convoId),
            { unread: false },
            { merge: true }
          ).catch(() => {})
        }
      },
      (err) => console.warn('DM: messages snapshot error —', err.message)
    )

    // Typing indicator listener
    unsubConvoRef.current = onSnapshot(doc(db, 'dms', convoId), (snap) => {
      setIsFriendTyping(snap.exists() ? !!snap.data()[`typing_${selectedFriend.uid}`] : false)
    })

    return () => {
      if (unsubMsgsRef.current)  unsubMsgsRef.current()
      if (unsubConvoRef.current) unsubConvoRef.current()
    }
  }, [selectedFriend, user?.uid, isOpen])

  // ─────────────────────────────────────────────────────────────────────────
  // SEND TEXT MESSAGE
  // Also writes the participants array + last_activity to the dms doc so that
  // the conversation appears in the recipient's list immediately (Instagram-style).
  // ─────────────────────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedFriend || sending) return
    setSending(true)
    try {
      const convoId = getConvoId(user.uid, selectedFriend.uid)

      // Clear typing indicator immediately
      setDoc(doc(db, 'dms', convoId), { [`typing_${user.uid}`]: false }, { merge: true }).catch(() => {})

      // Write the message
      await addDoc(collection(db, 'dms', convoId, 'messages'), {
        from:      user.uid,
        fromName:  profile?.full_name || 'Scholar',
        text:      newMsg.trim(),
        timestamp: serverTimestamp(),
      })

      // ⬇ This is what makes the chat appear for the RECIPIENT instantly —
      //   participants array lets us query all DMs for a user without relying
      //   on the friend list.
      await setDoc(doc(db, 'dms', convoId), {
        participants:  [user.uid, selectedFriend.uid],
        last_activity: serverTimestamp(),
      }, { merge: true })

      // Notify recipient
      await setDoc(
        doc(db, 'profiles', selectedFriend.uid, 'unread_dms', convoId),
        { unread: true, last_message_time: serverTimestamp() },
        { merge: true }
      ).catch(() => {})

      // Pin to my own sidebar
      await setDoc(
        doc(db, 'profiles', user.uid, 'unread_dms', convoId),
        { unread: false, last_message_time: serverTimestamp() },
        { merge: true }
      ).catch(() => {})

      setNewMsg('')
    } catch (err) {
      console.warn('DM: send error —', err.message)
    } finally {
      setSending(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEND IMAGE (Pro gated)
  // ─────────────────────────────────────────────────────────────────────────
  const handleImageClick = () => {
    if (!isPro) { alert('Image sharing is a Pro feature! Please upgrade.'); return }
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be smaller than 2MB'); return }
    setSending(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const convoId = getConvoId(user.uid, selectedFriend.uid)
        await addDoc(collection(db, 'dms', convoId, 'messages'), {
          from: user.uid, fromName: profile?.full_name || 'Scholar',
          text: '', image_url: reader.result, timestamp: serverTimestamp(),
        })
        await setDoc(doc(db, 'dms', convoId), {
          participants: [user.uid, selectedFriend.uid],
          last_activity: serverTimestamp(),
        }, { merge: true })
        await setDoc(doc(db, 'profiles', selectedFriend.uid, 'unread_dms', convoId),
          { unread: true, last_message_time: serverTimestamp() }, { merge: true }).catch(() => {})
        await setDoc(doc(db, 'profiles', user.uid, 'unread_dms', convoId),
          { unread: false, last_message_time: serverTimestamp() }, { merge: true }).catch(() => {})
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.warn('DM: image upload failed —', err.message)
    } finally {
      setSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TYPING INDICATOR (debounced)
  // ─────────────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setNewMsg(e.target.value)
    if (!selectedFriend || !user) return
    const convoId = getConvoId(user.uid, selectedFriend.uid)
    setDoc(doc(db, 'dms', convoId), { [`typing_${user.uid}`]: true }, { merge: true }).catch(() => {})
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(doc(db, 'dms', convoId), { [`typing_${user.uid}`]: false }, { merge: true }).catch(() => {})
    }, 2000)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────
  const isOnline = (ts) => {
    if (!ts) return false
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return Date.now() - d.getTime() < 3 * 60 * 1000
  }

  const timeLabel = (ms) => {
    if (!ms) return ''
    const d = new Date(ms), diffH = (Date.now() - d) / 3600000
    return diffH < 24
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="dm-backdrop" onClick={onClose} />
      <div className="dm-panel">
        <div className="dm-panel-inner">

          {/* ── Left: conversation list ── */}
          <div className="dm-friends-list">
            <div className="dm-panel-header">
              <span>💬 Messages</span>
              <button className="dm-close-btn" onClick={onClose}>×</button>
            </div>

            <div className="dm-friends-scroll">
              {conversations.length === 0 ? (
                <div className="dm-empty">
                  <span>💬</span>
                  <p>No conversations yet.<br />Use the 👥 button to find people!</p>
                </div>
              ) : (
                conversations.map(({ uid, profile: fp, convoId, lastMsg, lastTime }) => {
                  const isUnread = unreadSet.has(convoId)
                  const isActive = selectedFriend?.uid === uid
                  const friendObj = { uid, ...fp }

                  return (
                    <button
                      key={uid}
                      className={`dm-chat-row ${isActive ? 'dm-chat-row-active' : ''} ${isUnread ? 'dm-chat-row-unread' : ''}`}
                      onClick={() => setSelectedFriend(friendObj)}
                    >
                      <div className="dm-chat-row-avatar">
                        {fp?.photo_url
                          ? <img src={fp.photo_url} alt={fp.full_name} />
                          : <span>{fp?.avatar_emoji || fp?.full_name?.[0]?.toUpperCase() || '?'}</span>
                        }
                        {isOnline(fp?.last_active) && <span className="dm-online-dot" />}
                      </div>
                      <div className="dm-chat-row-info">
                        <div className="dm-chat-row-top">
                          <span className="dm-chat-row-name">{fp?.full_name || 'Scholar'}</span>
                          {lastMsg?.time ? <span className="dm-chat-row-time">{timeLabel(lastMsg.time)}</span> : null}
                        </div>
                        <div className="dm-chat-row-preview">
                          {lastMsg ? (
                            <span className={isUnread ? 'dm-preview-bold' : ''}>
                              {lastMsg.fromMe ? 'You: ' : ''}{lastMsg.text}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No messages yet</span>
                          )}
                          {isUnread && <span className="dm-chat-unread-dot" />}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Right: active chat ── */}
          <div className="dm-chat-area">
            {!selectedFriend ? (
              <div className="dm-chat-placeholder">
                <span>👈</span>
                <p>Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                <div className="dm-chat-header">
                  <div className="dm-friend-avatar sm">
                    {selectedFriend.photo_url
                      ? <img src={selectedFriend.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : (selectedFriend.avatar_emoji || selectedFriend.full_name?.[0]?.toUpperCase())
                    }
                    {isOnline(selectedFriend.last_active) && <span className="dm-online-dot sm" />}
                  </div>
                  <span className="dm-chat-name">{selectedFriend.full_name}</span>
                </div>

                <div className="dm-messages">
                  {messages.length === 0 && <div className="dm-no-msgs">Say hi! 👋</div>}
                  {messages.map(m => (
                    <div key={m.id} className={`dm-msg ${m.from === user.uid ? 'dm-msg-me' : 'dm-msg-them'}`}>
                      {m.image_url && <img src={m.image_url} alt="Shared" className="dm-msg-img" />}
                      {m.text      && <div className="dm-msg-bubble">{m.text}</div>}
                    </div>
                  ))}
                  {isFriendTyping && (
                    <div className="dm-typing-indicator">
                      <span /><span /><span />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="dm-input-row" onSubmit={sendMessage}>
                  <button type="button" className="dm-attach-btn" onClick={handleImageClick} title={isPro ? 'Send Image' : 'Image Sharing (Pro)'}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    {!isPro && (
                      <div className="dm-pro-lock">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z"/>
                        </svg>
                      </div>
                    )}
                  </button>
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />

                  <input
                    className="dm-input"
                    placeholder="Type a message..."
                    value={newMsg}
                    onChange={handleInputChange}
                    disabled={sending}
                    autoFocus
                  />
                  <button type="submit" className="dm-send-btn" disabled={!newMsg.trim() || sending}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default DirectMessages
