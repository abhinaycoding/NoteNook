import React, { createContext, useContext, useState, useEffect } from 'react'

const ZenContext = createContext({})

export const ZenProvider = ({ children }) => {
  const [isZenModeActive, setIsZenModeActive] = useState(false)
  const [activeSessionLength, setActiveSessionLength] = useState(25)
  const [activeTrackId, setActiveTrackId] = useState('lofi')

  // When timer starts zen mode, we can pass its preset along so
  // zen mode knows how long we are going for.
  const enterZenMode = (mins = 25) => {
    setActiveSessionLength(mins)
    setIsZenModeActive(true)
    // Optional: Hide overflow on body to prevent scrolling
    document.body.style.overflow = 'hidden'
  }

  const exitZenMode = () => {
    setIsZenModeActive(false)
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
  }

  const value = {
    isZenModeActive,
    enterZenMode,
    exitZenMode,
    activeSessionLength,
    activeTrackId,
    setActiveTrackId
  }

  return (
    <ZenContext.Provider value={value}>
      {children}
    </ZenContext.Provider>
  )
}

export const useZen = () => {
  return useContext(ZenContext)
}
