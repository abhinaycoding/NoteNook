/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PlanContext = createContext(null)

export function PlanProvider({ children }) {
  const { user } = useAuth()
  const [isPro, setIsPro] = useState(false)

  // Load plan from Supabase profile
  useEffect(() => {
    let sub = null

    const fetchPlan = async () => {
      if (!user) {
        setIsPro(false)
        return
      }

      // Initial fetch
      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single()
      
      setIsPro(!!data?.is_pro)

      // Listen for updates (e.g. from Stripe Webhook)
      sub = supabase
        .channel(`profile_plan:${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          setIsPro(!!payload.new.is_pro)
        })
        .subscribe()
    }

    fetchPlan()

    return () => {
      if (sub) supabase.removeChannel(sub)
    }
  }, [user])

  // Stub function for direct UI tests if needed (actual upgrades happen via Stripe Webhook)
  const upgradePlanFallback = async () => {
    if (!user) return
    setIsPro(true)
    try {
      await supabase.from('profiles').update({ is_pro: true }).eq('id', user.id)
    } catch { /* best-effort */ }
  }

  const downgradePlanFallback = async () => {
    if (!user) return
    setIsPro(false)
    try {
      await supabase.from('profiles').update({ is_pro: false }).eq('id', user.id)
    } catch { /* best-effort */ }
  }

  return (
    <PlanContext.Provider value={{ 
        isPro, 
        upgradePlan: upgradePlanFallback, 
        downgradePlan: downgradePlanFallback 
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
