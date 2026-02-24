import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Navigation.css'

const Navigation = ({ onNavigate, isAuthPage }) => {
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleLogin = () => {
    if (user) onNavigate('dashboard')
    else onNavigate('auth')
  }

  const handleBegin = () => {
    if (user) onNavigate('dashboard')
    else onNavigate('auth')
  }

  return (
    <header className={`editorial-nav ${scrolled ? 'nav-borders' : ''}`}>
      <div className="container nav-container">

        {/* Left: Branding */}
        <div className="nav-brand" onClick={() => onNavigate('landing')}>
          <div className="logo-mark font-serif">FF.</div>
          <span className="logo-type uppercase tracking-widest text-xs font-bold">FocusFlow</span>
        </div>

        {/* Center: Links */}
        {!isAuthPage && (
          <nav className="nav-menu">
            <button className="nav-item" onClick={() => scrollTo('manifesto')}>Manifesto</button>
            <button className="nav-item" onClick={() => scrollTo('tools')}>The Tools</button>
            <button className="nav-item" onClick={() => scrollTo('subscribe')}>Subscribe</button>
          </nav>
        )}

        {/* Right: Actions */}
        {!isAuthPage && (
          <div className="nav-actions">
            <button className="text-sm font-medium uppercase tracking-wide hover:italic" onClick={handleLogin}>
              {user ? 'Dashboard' : 'Log In'}
            </button>
            <button className="btn-primary ml-4" onClick={handleBegin}>
              {user ? 'Open App' : 'Begin'}
            </button>
          </div>
        )}

      </div>
    </header>
  )
}

export default Navigation
