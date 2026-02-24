import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  useEffect(() => {
    let resolved = false

    // Safety timeout — if Supabase doesn't respond in 4s, render the app anyway
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        setLoading(false)
      }
    }, 4000)

    // Primary: check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
      }
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        setLoading(false)
      }
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const value = {
    session,
    user,
    profile,
    signOut,
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
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2.5rem', color: '#CC4B2C' }}>FF.</div>
        <div style={{
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: '#707070',
          animation: 'none'
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
