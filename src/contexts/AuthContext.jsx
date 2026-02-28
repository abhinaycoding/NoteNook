/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false)

  const fetchProfile = async (userId, token) => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`
      const res = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (res.ok && data && data.length > 0) {
        setProfile(data[0])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const setLocalSession = async (newSession, newUser) => {
    if (newSession && newUser) {
      localStorage.setItem('ff_session', JSON.stringify({ session: newSession, user: newUser }))
      setSession(newSession)
      setUser(newUser)
      await supabase.auth.setSession({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token
      })
      await fetchProfile(newUser.id, newSession.access_token)
    } else {
      localStorage.removeItem('ff_session')
      setSession(null)
      setUser(null)
      setProfile(null)
      setIsPasswordResetFlow(false)
      await supabase.auth.signOut()
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('ff_session')
      if (stored) {
        try {
          const { session: storedSession, user: storedUser } = JSON.parse(stored)
          
          // Verify token hasn't completely expired (basic check)
          if (storedSession?.expires_at) {
            const expiresAt = new Date(storedSession.expires_at * 1000)
            if (expiresAt < new Date()) {
              console.log('Local session expired')
              localStorage.removeItem('ff_session')
              setLoading(false)
              return
            }
          }

          setSession(storedSession)
          setUser(storedUser)

          await supabase.auth.setSession({
            access_token: storedSession.access_token,
            refresh_token: storedSession.refresh_token
          })

          if (storedUser?.id) {
            await fetchProfile(storedUser.id, storedSession.access_token)
          }
        } catch (e) {
          console.error('Failed to parse local session', e)
        }
      }
      setLoading(false)
    }

    initAuth()

    // Listen for auth state changes — handles email verification redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' && newSession) {
        const u = newSession.user
        if (u && newSession.access_token) {
          setSession({
            access_token: newSession.access_token,
            refresh_token: newSession.refresh_token,
            expires_at: newSession.expires_at,
          })
          setUser(u)
          localStorage.setItem('ff_session', JSON.stringify({
            session: {
              access_token: newSession.access_token,
              refresh_token: newSession.refresh_token,
              expires_at: newSession.expires_at,
            },
            user: u,
          }))
          await fetchProfile(u.id, newSession.access_token)
        }
      }

      if (event === 'PASSWORD_RECOVERY') {
        console.log('[AuthContext] Password recovery event detected')
        setIsPasswordResetFlow(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => {
    setLocalSession(null, null)
  }

  const value = {
    session,
    user,
    profile,
    signOut,
    setLocalSession,
    isPasswordResetFlow,
    setIsPasswordResetFlow
  }

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F5F0',
        fontFamily: "'Instrument Serif', Georgia, serif",
        flexDirection: 'column',
        gap: '1rem',
        zIndex: 9999
      }}>
        <div style={{ fontSize: '2.5rem', color: '#CC4B2C' }}>NN.</div>
        <div style={{
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: '#707070'
        }}>
          Loading the Canvas...
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
