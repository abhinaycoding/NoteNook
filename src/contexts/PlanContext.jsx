/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'

const PlanContext = createContext(null)

export function PlanProvider({ children }) {
  const { user } = useAuth()
  const [isPro, setIsPro] = useState(false)

  // Load plan from Firestore profile
  useEffect(() => {
    if (!user?.uid) {
      setIsPro(false)
      return
    }

    // Subscribe to profile changes
    const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setIsPro(!!snapshot.data().is_pro)
      } else {
        setIsPro(false)
      }
    }, (error) => {
      console.warn('Plan listener error:', error.message)
    })

    return () => unsubscribe()
  }, [user])

  // Secure upgrade function called after successful Razorpay payment
  const upgradePlan = async () => {
    if (!user?.uid) {
      console.error('[PlanContext] No user found for upgrade');
      return;
    }
    
    console.log('[PlanContext] Upgrading user to Pro:', user.uid);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), { 
        is_pro: true,
        plan_tier: 'master',
        updated_at: new Date().toISOString()
      });
      setIsPro(true);
      return true;
    } catch (err) {
      console.error('[PlanContext] Upgrade failed:', err.message);
      throw err;
    }
  }

  const downgradePlanFallback = async () => {
    if (!user?.uid) return
    setIsPro(false)
    try {
      await updateDoc(doc(db, 'profiles', user.uid), { is_pro: false })
    } catch (err) {
      console.error('Manual downgrade failed:', err.message)
    }
  }

  // Force re-fetch plan status from DB
  const refreshPlan = async () => {
    if (!user?.uid) return
    try {
      const docSnap = await getDoc(doc(db, 'profiles', user.uid))
      if (docSnap.exists()) {
        setIsPro(!!docSnap.data().is_pro)
      }
    } catch (err) {
      console.error('Refresh plan error:', err.message)
    }
  }

  return (
    <PlanContext.Provider value={{ 
        isPro, 
        upgradePlan, 
        refreshPlan,
    }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider')
  return ctx
}
