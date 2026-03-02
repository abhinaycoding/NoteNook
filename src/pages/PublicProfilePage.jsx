import React, { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { LEVELS } from '../components/XPBar'
import { ALL_BADGES } from '../components/XPBar'

const getLevel = (xp) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return { ...LEVELS[i], index: i }
  }
  return { ...LEVELS[0], index: 0 }
}

const PublicProfilePage = ({ onNavigate }) => {
  const { user, profile } = useAuth()

  // For simplicity: show current user's own public profile
  // (In a real multi-user setup you'd route to /profile/:uid)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const xp = parseInt(localStorage.getItem('notenook_xp') || '0', 10)
  const earnedBadgeIds = (() => {
    try { return JSON.parse(localStorage.getItem('notenook_badges') || '[]') } catch { return [] }
  })()
  const xpStats = (() => {
    try { return JSON.parse(localStorage.getItem('notenook_stats') || '{}') } catch { return {} }
  })()

  const currentLevel = getLevel(xp)
  const nextLevel = LEVELS[currentLevel.index + 1]
  const xpInLevel = xp - currentLevel.minXP
  const xpForNext = nextLevel ? nextLevel.minXP - currentLevel.minXP : 1
  const progress = nextLevel ? Math.min((xpInLevel / xpForNext) * 100, 100) : 100

  useEffect(() => {
    if (!user?.uid) return
    const load = async () => {
      try {
        const [sessSnap, taskSnap] = await Promise.all([
          getDocs(query(collection(db, 'sessions'), where('user_id', '==', user.uid), where('completed', '==', true))),
          getDocs(query(collection(db, 'tasks'), where('user_id', '==', user.uid)))
        ])
        const sessions = sessSnap.docs.map(d => d.data())
        const tasks = taskSnap.docs.map(d => d.data())
        const totalMins = sessions.reduce((sum, s) => sum + Math.round((s.duration_seconds || 0) / 60), 0)
        const completedTasks = tasks.filter(t => t.completed).length

        setStats({
          sessions: sessions.length,
          totalHours: (totalMins / 60).toFixed(1),
          tasks: tasks.length,
          completedTasks,
        })
      } catch (e) {
        console.warn(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.uid])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const joinedDate = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const earnedBadges = ALL_BADGES.filter(b => earnedBadgeIds.includes(b.id))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '5rem' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, var(--bg-card)), var(--bg-card))',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1rem',
        position: 'relative',
      }}>
        {/* Back button */}
        <button
          onClick={() => onNavigate('dashboard')}
          style={{
            position: 'absolute', top: '1.25rem', left: '1.25rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', borderRadius: '50px',
            padding: '0.35rem 0.9rem', fontSize: '0.65rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
          }}
        >
          ← Back
        </button>

        {/* Avatar */}
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #ff8800)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', fontWeight: 700,
          boxShadow: '0 8px 30px color-mix(in srgb, var(--primary) 40%, transparent)',
          border: '3px solid var(--bg-card)',
        }}>
          {profile?.avatar_emoji || profile?.full_name?.[0] || '🎓'}
        </div>

        {/* Name */}
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0 }}>
            {profile?.full_name || 'Scholar'}
          </h1>
          {profile?.student_type && (
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)', fontWeight: 700, marginTop: '0.25rem' }}>
              {profile.student_type}
            </p>
          )}
          {joinedDate && (
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Studying since {joinedDate}
            </p>
          )}
        </div>

        {/* Level chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--bg-color)', border: '1px solid var(--border)',
          borderRadius: '50px', padding: '0.4rem 1rem',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{currentLevel.icon}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
            {currentLevel.name}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            · {xp} XP
          </span>
        </div>

        {/* XP progress bar */}
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            <span>{currentLevel.name}</span>
            <span>{nextLevel ? `${xpForNext - xpInLevel} XP to ${nextLevel.name}` : 'Max Level ⭐'}</span>
          </div>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--primary), #ff8800, #fbbf24)',
              borderRadius: 8,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>

        {/* Share button */}
        <button
          onClick={copyLink}
          style={{
            background: copied ? '#22c55e' : 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: '50px', padding: '0.5rem 1.5rem',
            fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s', marginTop: '0.25rem',
          }}
        >
          {copied ? '✓ Copied!' : '🔗 Share Profile'}
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'Sessions', value: loading ? '—' : stats?.sessions ?? 0, icon: '⏱' },
          { label: 'Hours', value: loading ? '—' : stats?.totalHours ?? 0, icon: '📚' },
          { label: 'Tasks Done', value: loading ? '—' : stats?.completedTasks ?? 0, icon: '✅' },
          { label: 'Badges', value: earnedBadges.length, icon: '🏅' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '1rem 0.75rem', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
          }}>
            <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges Section */}
      {earnedBadges.length > 0 && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            🏅 Earned Badges ({earnedBadges.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
            {earnedBadges.map(badge => (
              <div key={badge.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid color-mix(in srgb, #fbbf24 35%, transparent)',
                borderRadius: 16, padding: '1rem 0.75rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                textAlign: 'center',
                boxShadow: '0 2px 12px rgba(251, 191, 36, 0.12)',
              }}>
                <div style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}>{badge.emoji}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
                  {badge.name}
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {badge.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {earnedBadges.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
          No badges earned yet — start studying to unlock them! 🚀
        </div>
      )}
    </div>
  )
}

export default PublicProfilePage
