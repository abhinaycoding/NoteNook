import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

const TimerContext = createContext({})

const PRESETS = [25, 45, 60]

export const TimerProvider = ({ children }) => {
  const { user } = useAuth()
  const [selectedMinutes, setSelectedMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [sessionSaved, setSessionSaved] = useState(false)
  const intervalRef = useRef(null)

  // Main timer — lives at app level, never unmounts
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          setIsComplete(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  // Save session when complete
  useEffect(() => {
    if (!isComplete || !user || sessionSaved) return
    setSessionSaved(true)
    supabase.from('sessions').insert([{
      user_id: user.id,
      duration_seconds: selectedMinutes * 60,
      completed: true,
      created_at: new Date().toISOString(),
    }]).catch(err => console.error('Session save error:', err.message))
  }, [isComplete, user])

  const start = () => {
    if (isComplete) {
      setSecondsLeft(selectedMinutes * 60)
      setIsComplete(false)
      setSessionSaved(false)
    }
    setIsRunning(true)
  }

  const pause = () => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsComplete(false)
    setSessionSaved(false)
    setSecondsLeft(selectedMinutes * 60)
  }

  const changePreset = (minutes) => {
    if (isRunning) return
    clearInterval(intervalRef.current)
    setSelectedMinutes(minutes)
    setSecondsLeft(minutes * 60)
    setIsRunning(false)
    setIsComplete(false)
    setSessionSaved(false)
  }

  return (
    <TimerContext.Provider value={{
      selectedMinutes,
      secondsLeft,
      isRunning,
      isComplete,
      sessionSaved,
      start,
      pause,
      reset,
      changePreset,
      PRESETS,
    }}>
      {children}
    </TimerContext.Provider>
  )
}

export const useTimer = () => useContext(TimerContext)
