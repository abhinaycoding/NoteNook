import React, { useState, useEffect } from 'react'
import TaskPlanner from '../components/TaskPlanner'
import NotesPreview from '../components/NotesPreview'
import FocusTimer from '../components/FocusTimer'
import AnalyticsCards from '../components/AnalyticsCards'
import DraggableDashboard from '../components/DraggableDashboard'
import NotificationBell from '../components/NotificationBell'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import { supabase } from '../lib/supabase'
import OnboardingTour from '../components/OnboardingTour'
import DangerZone from '../components/DangerZone'
import './Dashboard.css'

const Dashboard = ({ onNavigate }) => {
  const { user, signOut } = useAuth()
  const { isPro } = usePlan()
  const [isEditing, setIsEditing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [streak, setStreak] = useState(0)
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('ff_onboarding_done'))

  // Compute greeting
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Scholar'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Calculate streak
  useEffect(() => {
    if (!user) return
    const calcStreak = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('created_at', { ascending: false })
      if (!data || data.length === 0) return

      // Get unique dates
      const dates = [...new Set(data.map(s => new Date(s.created_at).toDateString()))]
      let count = 0
      const today = new Date()
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today)
        expected.setDate(today.getDate() - i)
        if (dates[i] === expected.toDateString()) count++
        else break
      }
      setStreak(count)
    }
    calcStreak()
  }, [user])

  const handleLogout = () => {
    signOut()
    onNavigate('landing')
  }

  return (
    <>
    <div className="canvas-layout">
      {/* Header */}
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-8">
          <div
            className="logo-mark font-serif text-4xl text-primary"
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigate('landing')}
          >
            NN.
          </div>
          
          {/* Desktop Navigation - 3 Zone Layout */}
          <div className="desktop-nav-container flex-grow flex justify-between items-end ml-12">
            
            {/* Center: Primary Navigation */}
            <nav className="desktop-nav-main flex gap-6 items-center flex-grow justify-center">
              <button onClick={() => onNavigate('analytics')} className="dash-nav-btn">Analytics</button>
              <button onClick={() => onNavigate('rooms')} className="dash-nav-btn">Study Rooms</button>
              <button onClick={() => onNavigate('calendar')} className="dash-nav-btn">Calendar</button>
              <button onClick={() => onNavigate('exams')} className="dash-nav-btn">
                Exams {!isPro && <span className="pro-lock-badge" data-tooltip="Pro Feature: Full Exam Planner">Pro</span>}
              </button>
              <button onClick={() => onNavigate('goals')} className="dash-nav-btn">Goals</button>
              <button onClick={() => onNavigate('resume')} className="dash-nav-btn">
                Resume {!isPro && <span className="pro-lock-badge" data-tooltip="Pro Feature: AI Resume Builder">Pro</span>}
              </button>
            </nav>

            {/* Right: Utilities & Account */}
            <div className="desktop-nav-utilities flex gap-6 items-center justify-end">
              <div className="flex items-center gap-4 border-r border-ink pr-6 mr-2">
                <div className="uppercase tracking-widest text-[10px] font-bold font-serif italic text-muted">
                  Edition: <span className="text-primary not-italic">{isPro ? 'Pro' : 'Free'}</span>
                </div>
                <NotificationBell />
              </div>
              
              <button 
                onClick={() => isPro ? setIsEditing(!isEditing) : onNavigate('pricing')}
                className={`dash-nav-btn ${isEditing ? 'text-primary border-b border-primary' : ''}`}
              >
                {isEditing ? 'Save Layout' : 'Customize'} {!isPro && <span className="pro-lock-badge" data-tooltip="Pro Feature: Canvas Layouts">Pro</span>}
              </button>
              
              <button
                onClick={() => onNavigate('pricing')}
                className={`dash-nav-btn ${!isPro ? 'dash-nav-btn--highlight' : ''}`}
              >
                {isPro ? 'Plans' : '⭐ Upgrade'}
              </button>
              
              <button onClick={handleLogout} className="dash-nav-btn text-muted hover:text-primary">Sign Out</button>
            </div>
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

        {/* Welcome Greeting */}
        <div style={{ marginTop: '1.5rem' }}>
          <div className="welcome-greeting">
            {timeGreeting}, {userName}.
            {streak > 0 && <span className="streak-badge" data-tooltip="Focus sessions completed consecutively">🔥 {streak}-day streak</span>}
          </div>
          <div className="welcome-date">{dateStr}</div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-menu flex flex-col gap-4 mt-6 border-b border-ink pb-6 tracking-widest">
            <div className="uppercase text-xs font-bold font-serif italic text-primary mb-4">
              Edition: {isPro ? 'Pro' : 'Free'}
            </div>
            
            <button 
              onClick={() => { setIsMobileMenuOpen(false); if(isPro) setIsEditing(!isEditing); else onNavigate('pricing'); }}
              className={`text-left text-sm uppercase hover:text-primary transition-colors ${isEditing ? 'text-primary' : ''}`}
            >
              {isEditing ? 'Save Layout' : 'Customize'} {!isPro && <span className="pro-lock-badge">Pro</span>}
            </button>
            <button onClick={() => { setIsMobileMenuOpen(false); onNavigate('analytics'); }} className="text-left text-sm uppercase hover:text-primary transition-colors">Analytics</button>
            <button onClick={() => { setIsMobileMenuOpen(false); onNavigate('calendar'); }} className="text-left text-sm uppercase hover:text-primary transition-colors">Calendar</button>
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
        <DangerZone />
        <DraggableDashboard 
          onNavigate={onNavigate}
          isPro={isPro}
          isEditing={isEditing}
        />
      </main>
    </div>

    {/* Onboarding Tour — first visit only */}
    {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
    </>
  )
}

export default Dashboard
