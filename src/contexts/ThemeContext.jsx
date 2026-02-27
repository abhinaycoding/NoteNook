/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const THEMES = [
  { id: 'light',    label: 'Light',    icon: '☀',  dark: false },
  { id: 'dark',     label: 'Dark',     icon: '☽',  dark: true },
  { id: 'midnight', label: 'Midnight', icon: '🌊', dark: true },
  { id: 'forest',   label: 'Forest',   icon: '🌲', dark: true },
  { id: 'rosewood', label: 'Rosewood', icon: '🌸', dark: true },
  { id: 'sepia',    label: 'Sepia',    icon: '📜', dark: false },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ff_theme') || 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
    localStorage.setItem('ff_theme', theme)
  }, [theme])

  const isDark = THEMES.find(t => t.id === theme)?.dark ?? false

  const toggle = () => {
    // Simple toggle cycles: light → dark → light
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setThemeById = (id) => {
    const valid = THEMES.find(t => t.id === id)
    if (valid) setTheme(id)
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggle, setThemeById, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
