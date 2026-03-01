import React, { useEffect, useState } from 'react'
import { useTranslation } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import './Navigation.css'

const Navigation = ({ onNavigate, isAuthPage }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const { t } = useTranslation()

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

  const handleOpenApp = () => {
    onNavigate(user ? 'dashboard' : 'auth')
  }

  return (
    <header className={`editorial-nav ${scrolled ? 'nav-borders' : ''}`}>
      <div className="container nav-container">

        {/* Left: Branding */}
        <div className="nav-brand" onClick={() => onNavigate('landing')}>
          <div className="logo-mark font-serif">NN.</div>
          <span className="logo-type uppercase tracking-widest text-xs font-bold">NoteNook</span>
        </div>

        {/* Center: Links */}
        {!isAuthPage && (
          <nav className="nav-menu">
            <button className="nav-item" onClick={() => scrollTo('manifesto')}>{t('nav.manifesto')}</button>
            <button className="nav-item" onClick={() => scrollTo('tools')}>{t('nav.theTools')}</button>
            <button className="nav-item" onClick={() => scrollTo('subscribe')}>{t('nav.subscribe')}</button>
          </nav>
        )}

        {/* Right: Actions */}
        {!isAuthPage && (
          <div className="nav-actions">
            <button className="btn-primary" onClick={handleOpenApp}>
              {user ? t('nav.openApp') : 'Log In / Sign Up'}
            </button>
            <button 
              className="mobile-nav-hamburger" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? '×' : '☰'}
            </button>
          </div>
        )}

      </div>

      {/* Mobile Dropdown */}
      {!isAuthPage && mobileMenuOpen && (
        <div className="mobile-dropdown-menu">
          <button className="nav-item" onClick={() => { scrollTo('manifesto'); setMobileMenuOpen(false); }}>{t('nav.manifesto')}</button>
          <button className="nav-item" onClick={() => { scrollTo('tools'); setMobileMenuOpen(false); }}>{t('nav.theTools')}</button>
          <button className="nav-item" onClick={() => { scrollTo('subscribe'); setMobileMenuOpen(false); }}>{t('nav.subscribe')}</button>
          <button className="nav-item" onClick={() => { handleOpenApp(); setMobileMenuOpen(false); }}>
            {user ? t('nav.dashboard') : 'Log In / Sign Up'}
          </button>
        </div>
      )}
    </header>
  )
}

export default Navigation
