import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import AuthPage from './pages/AuthPage'
import ProfileSetup from './pages/ProfileSetup'
import LibraryPage from './pages/LibraryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ExamPlannerPage from './pages/ExamPlannerPage'
import GoalsPage from './pages/GoalsPage'
import ResumeBuilderPage from './pages/ResumeBuilderPage'
import PricingPage from './pages/PricingPage'
import CalendarPage from './pages/CalendarPage'
import StudyRoomsListPage from './pages/StudyRoomsListPage'
import StudyRoomPage from './pages/StudyRoomPage'
import CustomCursor from './components/CustomCursor'
import ProGate from './components/ProGate'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import './App.css'

const PROTECTED = ['dashboard', 'setup', 'library', 'analytics', 'exams', 'goals', 'resume', 'pricing', 'calendar', 'rooms', 'room']

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [activeRoomName, setActiveRoomName] = useState('')
  const { user, profile } = useAuth()
  const { isDark, toggle, theme, setThemeById, themes } = useTheme()
  const [themePanelOpen, setThemePanelOpen] = useState(false)

  const enterRoom = (id, name) => {
    setActiveRoomId(id)
    setActiveRoomName(name)
    setCurrentPage('room')
  }

  const navigateTo = (page) => {
    if (PROTECTED.includes(page) && !user) {
      setCurrentPage('auth')
      return
    }
    setCurrentPage(page)
  }

  useEffect(() => {
    if (!user && PROTECTED.includes(currentPage)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage('landing')
      return
    }
    if (user && profile) {
      const needsSetup = !profile.student_type || !profile.target_exam || !profile.goals
      if (currentPage === 'auth') {
        setCurrentPage(needsSetup ? 'setup' : 'dashboard')
      } else if (currentPage === 'dashboard' && needsSetup) {
        setCurrentPage('setup')
      }
    }
  }, [user, profile, currentPage])

  return (
    <>
      <CustomCursor />

      {/* Floating theme picker */}
      <div className="theme-picker-wrap">
        <button
          className="theme-toggle"
          onClick={toggle}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {themes.find(t => t.id === theme)?.icon || '☽'}
        </button>
        <button
          className="theme-expand-btn"
          onClick={() => setThemePanelOpen(!themePanelOpen)}
          aria-label="Theme options"
        >
          {themePanelOpen ? '✕' : '▲'}
        </button>
        {themePanelOpen && (
          <div className="theme-panel">
            {themes.map(t => (
              <button
                key={t.id}
                className={`theme-swatch ${theme === t.id ? 'theme-swatch--active' : ''}`}
                onClick={() => { setThemeById(t.id); setThemePanelOpen(false) }}
                title={t.label}
              >
                <span className="theme-swatch-icon">{t.icon}</span>
                <span className="theme-swatch-label">{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div key={currentPage} className="page-transition">
        {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
        {currentPage === 'auth' && <AuthPage onNavigate={navigateTo} />}
        {currentPage === 'setup' && user && <ProfileSetup onNavigate={navigateTo} user={user} />}
        {currentPage === 'dashboard' && user && <Dashboard onNavigate={navigateTo} />}
        {currentPage === 'library' && user && <LibraryPage onNavigate={navigateTo} user={user} />}
        {currentPage === 'analytics' && user && <AnalyticsPage onNavigate={navigateTo} />}
        {currentPage === 'goals' && user && <GoalsPage onNavigate={navigateTo} />}
        {currentPage === 'pricing' && user && <PricingPage onNavigate={navigateTo} />}
        {currentPage === 'calendar' && user && <CalendarPage onNavigate={navigateTo} />}
        {currentPage === 'rooms' && user && <StudyRoomsListPage onNavigate={navigateTo} onEnterRoom={enterRoom} />}
        {currentPage === 'room' && user && activeRoomId && (
          <StudyRoomPage
            roomId={activeRoomId}
            roomName={activeRoomName}
            onNavigate={navigateTo}
            onBack={() => navigateTo('rooms')}
          />
        )}

        {/* Pro-gated pages */}
        {currentPage === 'exams' && user && (
          <ProGate feature="Exam Planner" onNavigatePricing={navigateTo}>
            <ExamPlannerPage onNavigate={navigateTo} />
          </ProGate>
        )}
        {currentPage === 'resume' && user && (
          <ProGate feature="Resume Builder" onNavigatePricing={navigateTo}>
            <ResumeBuilderPage onNavigate={navigateTo} />
          </ProGate>
        )}
      </div>
    </>
  )
}

export default App
