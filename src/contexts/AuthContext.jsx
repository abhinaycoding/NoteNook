/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

export const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileReady, setProfileReady] = useState(false)
  const [loading, setLoading] = useState(true)

  const authFlowIdRef = useRef(0)

  const hydrateProfile = useCallback(async (uid, flowId) => {
    try {
      const docRef = doc(db, 'profiles', uid)
      const docSnap = await getDoc(docRef)

      if (flowId !== authFlowIdRef.current) return

      if (docSnap.exists()) {
        setProfile(docSnap.data())
      } else {
        // Auto-initialize profile if it doesn't exist
        const newProfile = {
          id: uid,
          updated_at: new Date().toISOString(),
          is_pro: false,
          student_type: 'High School',
          full_name: auth.currentUser?.displayName || 'Scholar'
        }
        await setDoc(docRef, newProfile)
        setProfile(newProfile)
      }
    } catch (err) {
      if (flowId !== authFlowIdRef.current) return
      console.warn('Profile hydration failed:', err.message)
      setProfile(null)
    } finally {
      if (flowId === authFlowIdRef.current) {
        setProfileReady(true)
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let unsubscribeProfile = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      const flowId = ++authFlowIdRef.current

      if (unsubscribeProfile) {
        unsubscribeProfile()
        unsubscribeProfile = null
      }

      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        setProfileReady(true)
        setLoading(false)
        return
      }

      setUser(firebaseUser)
      setProfileReady(false)

      // Initial hydration
      await hydrateProfile(firebaseUser.uid, flowId)

      // Set up real-time listener for profile changes (replaces multiple manual refreshes)
      unsubscribeProfile = onSnapshot(doc(db, 'profiles', firebaseUser.uid), (snapshot) => {
        if (flowId === authFlowIdRef.current && snapshot.exists()) {
          setProfile(snapshot.data())
        }
      })
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeProfile) unsubscribeProfile()
      authFlowIdRef.current += 1
    }
  }, [hydrateProfile])

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const refreshProfile = async () => {
    if (!user?.uid) {
      setProfile(null)
      setProfileReady(true)
      return
    }
    const flowId = ++authFlowIdRef.current
    setProfileReady(false)
    await hydrateProfile(user.uid, flowId)
  }

  const value = {
    user,
    profile,
    profileReady,
    loading,
    signOut,
    refreshProfile,
    // session is maintained as undefined/null for compat, firebase uses currentUser
    session: user ? { user } : null 
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
