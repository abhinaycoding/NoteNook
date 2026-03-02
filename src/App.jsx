import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
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
import ZenMode from './components/ZenMode'
import CommandPalette from './components/CommandPalette'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import { useTranslation } from './contexts/LanguageContext'
import './App.css'

const ProtectedRoute = ({ user, profile, profileReady, currentPage, onRedirect, children }) => {
  useEffect(() => {
    if (!user) {
      onRedirect('auth')
      return
    }

    if (profileReady && !profile && currentPage !== 'setup') {
      onRedirect('setup')
    }
  }, [user, profile, profileReady, currentPage, onRedirect])

  if (!user) return null
  if (!profileReady) return null
  if (!profile && currentPage !== 'setup') return null
  return children
}

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [activeRoomName, setActiveRoomName] = useState('')
  const { user, profile, profileReady, loading: authLoading } = useAuth()
  const { isDark, toggle, theme, setThemeById, themes } = useTheme()
  const { language, setLanguage, languages } = useTranslation()
  const [themePanelOpen, setThemePanelOpen] = useState(false)
  const [langPanelOpen, setLangPanelOpen] = useState(false)

  const enterRoom = (id, name) => {
    setActiveRoomId(id)
    setActiveRoomName(name)
    setCurrentPage('room')
  }

  const navigateTo = (page) => {
    setCurrentPage(page)
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color, #0a0a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border, rgba(255,255,255,0.1))', borderTopColor: 'var(--accent, #ea580c)', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  const pageToRender = currentPage === 'auth' && user && profileReady
    ? (profile ? 'dashboard' : 'setup')
    : currentPage

  return (
    <>
      <CustomCursor />

      <div className="theme-picker-wrap">
        <button
          className="theme-toggle"
          onClick={toggle}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {themes.find(t => t.id === theme)?.icon || 'Theme'}
        </button>
        <button
          className="theme-expand-btn"
          onClick={() => setThemePanelOpen(!themePanelOpen)}
          aria-label="Theme options"
        >
          {themePanelOpen ? 'Close' : 'Menu'}
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

      <div className="lang-picker-wrap">
        <button
          className="lang-toggle"
          onClick={() => setLangPanelOpen(!langPanelOpen)}
          title="Change Language"
          aria-label="Change language"
        >
          Lang
        </button>
        {langPanelOpen && (
          <div className="lang-panel">
            {languages.map(l => (
              <button
                key={l.code}
                className={`lang-option ${language === l.code ? 'lang-option--active' : ''}`}
                onClick={() => { setLanguage(l.code); setLangPanelOpen(false) }}
              >
                <span className="lang-flag">{l.flag}</span>
                <span className="lang-label">{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div key={pageToRender} className="page-transition">
        {pageToRender === 'landing' && <LandingPage onNavigate={navigateTo} />}
        {pageToRender === 'auth' && <AuthPage onNavigate={navigateTo} />}

        {pageToRender === 'setup' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <ProfileSetup onNavigate={navigateTo} />
          </ProtectedRoute>
        )}

        {pageToRender === 'dashboard' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <Dashboard onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {pageToRender === 'library' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <LibraryPage onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {pageToRender === 'analytics' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <AnalyticsPage onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {pageToRender === 'goals' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <GoalsPage onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {pageToRender === 'pricing' && <PricingPage onNavigate={navigateTo} />}
        {pageToRender === 'calendar' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <CalendarPage onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {pageToRender === 'rooms' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <StudyRoomsListPage onNavigate={navigateTo} onEnterRoom={enterRoom} />
          </ProtectedRoute>
        )}
        {pageToRender === 'room' && activeRoomId && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <StudyRoomPage
              roomId={activeRoomId}
              roomName={activeRoomName}
              onNavigate={navigateTo}
              onBack={() => navigateTo('rooms')}
            />
          </ProtectedRoute>
        )}

        {pageToRender === 'exams' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <ProGate feature="Exam Planner" onNavigatePricing={navigateTo}>
              <ExamPlannerPage onNavigate={navigateTo} />
            </ProGate>
          </ProtectedRoute>
        )}
        {pageToRender === 'resume' && (
          <ProtectedRoute user={user} profile={profile} profileReady={profileReady} currentPage={pageToRender} onRedirect={navigateTo}>
            <ProGate feature="Resume Builder" onNavigatePricing={navigateTo}>
              <ResumeBuilderPage onNavigate={navigateTo} />
            </ProGate>
          </ProtectedRoute>
        )}
      </div>

      <ZenMode />

      <CommandPalette
        onNavigate={navigateTo}
        onAction={(action) => {
          if (action === 'toggle-theme') toggle()
          if (action === 'zen') {
            window.dispatchEvent(new CustomEvent('activate-zen'))
          }
          if (action === 'focus-task') {
            navigateTo('dashboard')
            setTimeout(() => {
              document.querySelector('.task-add-input')?.focus()
            }, 300)
          }
        }}
      />
    </>
  )
}

export default App
