import React, { useState } from 'react'
import TaskPlanner from '../components/TaskPlanner'
import NotesPreview from '../components/NotesPreview'
import FocusTimer from '../components/FocusTimer'
import AnalyticsCards from '../components/AnalyticsCards'
import DraggableDashboard from '../components/DraggableDashboard'
import NotificationBell from '../components/NotificationBell'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import './Dashboard.css'

const Dashboard = ({ onNavigate }) => {
  const { user, signOut } = useAuth()
  const { isPro } = usePlan()
  const [isEditing, setIsEditing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    signOut()
    onNavigate('landing')
  }

  return (
    <div className="canvas-layout">
      {/* Header */}
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-4">
          <div
            className="logo-mark font-serif text-4xl text-primary"
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigate('landing')}
          >
            FF.
          </div>
          
          {/* Desktop Navigation */}
          <div className="desktop-nav gap-8 items-end text-right">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="uppercase tracking-widest text-xs font-bold font-serif italic">
                  Edition: {isPro ? 'Pro' : 'Free'}
                </div>
                <div className="uppercase tracking-widest text-xs mt-1">
                  Reader: {user?.user_metadata?.full_name || 'Scholar'}
                </div>
              </div>
              <NotificationBell />
            </div>
            
            {/* Customization Toggle */}
            <button 
              onClick={() => isPro ? setIsEditing(!isEditing) : onNavigate('pricing')}
              className={`dash-nav-btn ${isEditing ? 'text-primary border-b border-primary' : ''}`}
            >
              {isEditing ? 'Save Layout' : 'Customize'} {!isPro && <span className="pro-lock-badge">Pro</span>}
            </button>

            <button onClick={() => onNavigate('analytics')} className="dash-nav-btn">Analytics</button>
            <button onClick={() => onNavigate('exams')} className="dash-nav-btn">
              Exams {!isPro && <span className="pro-lock-badge">Pro</span>}
            </button>
            <button onClick={() => onNavigate('goals')} className="dash-nav-btn">Goals</button>
            <button onClick={() => onNavigate('resume')} className="dash-nav-btn">
              Resume {!isPro && <span className="pro-lock-badge">Pro</span>}
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className={`dash-nav-btn ${!isPro ? 'dash-nav-btn--highlight' : ''}`}
            >
              {isPro ? 'Plans' : '⭐ Upgrade'}
            </button>
            <button onClick={handleLogout} className="dash-nav-btn">Sign Out</button>
          </div>

          {/* Mobile Hamburger Toggle & Bell */}
          <div className="mobile-nav-toggle items-center gap-4">
            <NotificationBell />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="text-primary text-3xl pb-1"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? '×' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-menu flex flex-col gap-4 mt-6 border-b border-ink pb-6 tracking-widest">
            <div>
              <div className="uppercase text-xs font-bold font-serif italic text-primary">
                Edition: {isPro ? 'Pro' : 'Free'}
              </div>
              <div className="uppercase text-xs mt-1 mb-4 text-muted">
                Reader: {user?.user_metadata?.full_name || 'Scholar'}
              </div>
            </div>
            
            <button 
              onClick={() => { setIsMobileMenuOpen(false); if(isPro) setIsEditing(!isEditing); else onNavigate('pricing'); }}
              className={`text-left text-sm uppercase hover:text-primary transition-colors ${isEditing ? 'text-primary' : ''}`}
            >
              {isEditing ? 'Save Layout' : 'Customize'} {!isPro && <span className="pro-lock-badge">Pro</span>}
            </button>
            <button onClick={() => { setIsMobileMenuOpen(false); onNavigate('analytics'); }} className="text-left text-sm uppercase hover:text-primary transition-colors">Analytics</button>
            <button onClick={() => { setIsMobileMenuOpen(false); onNavigate('exams'); }} className="text-left text-sm uppercase hover:text-primary transition-colors">
              Exams {!isPro && <span className="pro-lock-badge">Pro</span>}
            </button>
            <button onClick={() => { setIsMobileMenuOpen(false); onNavigate('goals'); }} className="text-left text-sm uppercase hover:text-primary transition-colors">Goals</button>
            <button onClick={() => { setIsMobileMenuOpen(false); onNavigate('resume'); }} className="text-left text-sm uppercase hover:text-primary transition-colors">
              Resume {!isPro && <span className="pro-lock-badge">Pro</span>}
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); onNavigate('pricing'); }}
              className={`text-left text-sm uppercase hover:text-primary transition-colors ${!isPro ? 'text-primary font-bold' : ''}`}
            >
              {isPro ? 'Plans' : '⭐ Upgrade'}
            </button>
            <button onClick={handleLogout} className="text-left text-sm uppercase text-muted hover:text-primary transition-colors">Sign Out</button>
          </div>
        )}
      </header>

      <main className="canvas-main container" style={{ marginTop: '3rem', paddingBottom: '5rem' }}>
        <DraggableDashboard 
          onNavigate={onNavigate}
          isPro={isPro}
          isEditing={isEditing}
        />
      </main>
    </div>
  )
}

export default Dashboard
