import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../contexts/LanguageContext'
import './MobileBottomNav.css'

const MobileBottomNav = ({ onNavigate, currentPage = 'dashboard' }) => {
  const { t } = useTranslation()
  const [moreOpen, setMoreOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - lastScrollY.current
      // Only toggle after 10px threshold to avoid jitter
      if (delta > 10) setVisible(false)   // scrolling down → hide
      else if (delta < -10) setVisible(true) // scrolling up → show
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const tabs = [
    { id: 'dashboard', icon: '⏱', label: t('timer.zenMode').split(' ')[0] || 'Timer' },
    { id: 'goals', icon: '🎯', label: t('dashboard.goals') },
    { id: 'analytics', icon: '📊', label: t('dashboard.analytics') },
    { id: 'rooms', icon: '👥', label: t('dashboard.studyRooms').split(' ')[0] || 'Rooms' },
  ]

  const moreItems = [
    { id: 'calendar', icon: '📅', label: t('dashboard.calendar') },
    { id: 'exams', icon: '📝', label: t('dashboard.exams') },
    { id: 'resume', icon: '📄', label: t('dashboard.resume') },
    { id: 'pricing', icon: '⭐', label: t('dashboard.plans') },
  ]

  return (
    <>
      {/* More sheet overlay */}
      {moreOpen && (
        <div className="mobile-more-overlay" onClick={() => setMoreOpen(false)}>
          <div className="mobile-more-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-more-handle" />
            <div className="mobile-more-grid">
              {moreItems.map(item => (
                <button
                  key={item.id}
                  className="mobile-more-item"
                  onClick={() => { onNavigate(item.id); setMoreOpen(false) }}
                >
                  <span className="mobile-more-icon">{item.icon}</span>
                  <span className="mobile-more-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className={`mobile-bottom-nav ${visible ? '' : 'mobile-bottom-nav--hidden'}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`mobile-tab ${currentPage === tab.id ? 'mobile-tab--active' : ''}`}
            onClick={() => onNavigate(tab.id)}
          >
            <span className="mobile-tab-icon">{tab.icon}</span>
            <span className="mobile-tab-label">{tab.label}</span>
          </button>
        ))}
        <button
          className={`mobile-tab ${moreOpen ? 'mobile-tab--active' : ''}`}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <span className="mobile-tab-icon">⋯</span>
          <span className="mobile-tab-label">More</span>
        </button>
      </nav>
    </>
  )
}

export default MobileBottomNav
