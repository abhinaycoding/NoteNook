/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('[AuthContext] fetchProfile error:', err)
    }
  }

  useEffect(() => {
    // Step 1: Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Step 2: Listen for any future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] event:', event)

        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordResetFlow(true)
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setIsPasswordResetFlow(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsPasswordResetFlow(false)
  }

  const value = {
    user,
    profile,
    loading,
    isPasswordResetFlow,
    setIsPasswordResetFlow,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id),
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

export const useAuth = () => useContext(AuthContext)
