/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileReady, setProfileReady] = useState(false)
  const [loading, setLoading] = useState(true)

  const resolved = useRef(false)
  const safetyTimeoutRef = useRef(null)
  const authFlowIdRef = useRef(0)

  const resolveLoading = useCallback(() => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
    }

    if (!resolved.current) {
      resolved.current = true
      setLoading(false)
    }
  }, [])

  const clearAuthState = useCallback(() => {
    setSession(null)
    setUser(null)
    setProfile(null)
    setProfileReady(true)
    resolveLoading()
  }, [resolveLoading])

  const hydrateProfile = useCallback(async (userId, flowId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (flowId !== authFlowIdRef.current) return

      if (error) {
        console.error('Fetch profile error:', error)
        setProfile(null)
      } else {
        setProfile(data ?? null)
      }
    } catch (err) {
      if (flowId !== authFlowIdRef.current) return
      console.error('Fetch profile exception:', err)
      setProfile(null)
    } finally {
      if (flowId === authFlowIdRef.current) {
        setProfileReady(true)
        resolveLoading()
      }
    }
  }, [resolveLoading])

  const applySession = useCallback(async (currentSession) => {
    const flowId = ++authFlowIdRef.current

    if (!currentSession?.access_token) {
      clearAuthState()
      return
    }

    // Validate token against Auth API before trusting user state.
    const { data: userData, error: userErr } = await supabase.auth.getUser(currentSession.access_token)

    if (flowId !== authFlowIdRef.current) return

    if (userErr || !userData?.user) {
      console.warn('Invalid or stale session detected. Clearing local auth state.')
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch {
        // Ignore sign-out failures while recovering from stale tokens.
      }
      if (flowId === authFlowIdRef.current) {
        clearAuthState()
      }
      return
    }

    setSession(currentSession)
    setUser(userData.user)
    setProfile(null)
    setProfileReady(false)

    await hydrateProfile(userData.user.id, flowId)
  }, [clearAuthState, hydrateProfile])

  useEffect(() => {
    let isMounted = true

    safetyTimeoutRef.current = setTimeout(() => {
      if (resolved.current) return
      console.error('AuthContext: Supabase auth client is deadlocked! Clearing corrupted browser session and restarting...')
      try {
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
      } catch (e) {
        resolveLoading()
      }
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return
      await applySession(currentSession)
    })

    // Fallback in case INITIAL_SESSION is delayed.
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return
      await applySession(currentSession)
    }).catch((err) => {
      if (!isMounted) return
      console.error('Initial session error:', err)
      clearAuthState()
    })

    return () => {
      isMounted = false
      authFlowIdRef.current += 1
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
        safetyTimeoutRef.current = null
      }
      subscription.unsubscribe()
    }
  }, [applySession, clearAuthState, resolveLoading])

  const signOut = async () => {
    clearAuthState()
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null)
      setProfileReady(true)
      return
    }

    const flowId = ++authFlowIdRef.current
    setProfileReady(false)
    await hydrateProfile(user.id, flowId)
  }

  const value = {
    session,
    user,
    profile,
    profileReady,
    loading,
    signOut,
    refreshProfile,
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
