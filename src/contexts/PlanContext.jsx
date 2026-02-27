/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PlanContext = createContext(null)

export function PlanProvider({ children }) {
  const { user } = useAuth()
  const [isPro, setIsPro] = useState(false)

  // Load plan from localStorage (keyed per user)
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`ff_plan_${user.id}`)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPro(stored === 'pro')
    } else {
      setIsPro(false)
    }
  }, [user])

  const upgradePlan = async () => {
    if (!user) return
    localStorage.setItem(`ff_plan_${user.id}`, 'pro')
    setIsPro(true)
    // Best-effort Supabase update — won't fail if column doesn't exist yet
    try {
      await supabase.from('profiles').update({ is_pro: true }).eq('id', user.id)
    } catch { /* best-effort */ }
  }

  const downgradePlan = async () => {
    if (!user) return
    localStorage.setItem(`ff_plan_${user.id}`, 'free')
    setIsPro(false)
    try {
      await supabase.from('profiles').update({ is_pro: false }).eq('id', user.id)
    } catch { /* best-effort */ }
  }

  return (
    <PlanContext.Provider value={{ isPro, upgradePlan, downgradePlan }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider')
  return ctx
}
