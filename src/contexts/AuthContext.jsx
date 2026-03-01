import React, { createContext, useState, useEffect, useRef, useContext } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Track whether we've already resolved loading so we never set it true again
  const resolved = useRef(false)

  const resolveLoading = () => {
    if (!resolved.current) {
      resolved.current = true
      setLoading(false)
    }
  }

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data)
      } else {
        // PGRST116 = no row found (user needs ProfileSetup)
        setProfile(null)
      }
    } catch (err) {
      console.error('Fetch profile error:', err)
    } finally {
      resolveLoading()
    }
  }

  useEffect(() => {
    // Safety timeout: never stay on the loading screen for more than 5 seconds
    // Handles network issues, Supabase downtime, etc.
    const safetyTimeout = setTimeout(() => {
      console.warn('AuthContext: safety timeout reached — forcing loading=false')
      resolveLoading()
    }, 5000)

    // onAuthStateChange is the single source of truth.
    // It fires INITIAL_SESSION immediately (synchronously before any awaits)
    // so we don't need a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id)
        } else {
          setProfile(null)
          resolveLoading() // Important: resolve immediately if no user
        }
      }
    )

    // Also check initial session immediately to avoid waiting for the event
    // if the user is completely signed out and has no cached session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!currentSession) {
        resolveLoading()
      }
    })

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    // Reset local state immediately so UI reacts instantly
    setUser(null)
    setSession(null)
    setProfile(null)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
