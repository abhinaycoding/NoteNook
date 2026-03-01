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

/**
 * ProtectedRoute — defined OUTSIDE App so it's a stable component reference
 * and doesn't remount every time App re-renders.
 */
const ProtectedRoute = ({ user, profile, currentPage, onRedirect, children }) => {
  useEffect(() => {
    if (!user) {
      onRedirect('auth')
    } else if (user && !profile && currentPage !== 'setup') {
      onRedirect('setup')
    }
  }, [user, profile, currentPage, onRedirect])

  if (!user) return null
  if (user && !profile && currentPage !== 'setup') return null
  return children
}


function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [activeRoomName, setActiveRoomName] = useState('')
  const { user, profile, loading: authLoading } = useAuth()
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

  // ── OAuth Redirect Handler ─────────────────────────────────────────────────
  // After Google OAuth completes, Supabase fires onAuthStateChange which sets
  // `user`. At that point currentPage is 'auth', so we need to push the user 
  // forward to the right destination. We ONLY do this from the 'auth' page
  // so we don't aggressively redirect users who just visit the landing page.
  useEffect(() => {
    // Wait until auth is fully resolved (including fetching the profile)
    if (authLoading || !user) return
    
    // Only auto-redirect if they are actively on the Auth page (e.g. returning from Google)
    if (currentPage === 'auth') {
      // New Google users have no profile yet → send to setup
      // Returning users have a profile → send to dashboard
      navigateTo(profile ? 'dashboard' : 'setup')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading, currentPage])


  // Global loading state while AuthContext resolves session
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color, #0a0a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border, rgba(255,255,255,0.1))', borderTopColor: 'var(--accent, #ea580c)', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

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

      {/* Floating language picker */}
      <div className="lang-picker-wrap">
        <button
          className="lang-toggle"
          onClick={() => setLangPanelOpen(!langPanelOpen)}
          title="Change Language"
          aria-label="Change language"
        >
          🌐
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

      <div key={currentPage} className="page-transition">
        {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
        {currentPage === 'auth' && <AuthPage onNavigate={navigateTo} />}
        
        {currentPage === 'setup' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <ProfileSetup onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        
        {currentPage === 'dashboard' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <Dashboard onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {currentPage === 'library' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <LibraryPage onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {currentPage === 'analytics' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <AnalyticsPage onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {currentPage === 'goals' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <GoalsPage onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {currentPage === 'pricing' && <PricingPage onNavigate={navigateTo} />}
        {currentPage === 'calendar' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <CalendarPage onNavigate={navigateTo} />
          </ProtectedRoute>
        )}
        {currentPage === 'rooms' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <StudyRoomsListPage onNavigate={navigateTo} onEnterRoom={enterRoom} />
          </ProtectedRoute>
        )}
        {currentPage === 'room' && activeRoomId && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <StudyRoomPage
              roomId={activeRoomId}
              roomName={activeRoomName}
              onNavigate={navigateTo}
              onBack={() => navigateTo('rooms')}
            />
          </ProtectedRoute>
        )}

        {/* Pro-gated pages */}
        {currentPage === 'exams' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <ProGate feature="Exam Planner" onNavigatePricing={navigateTo}>
              <ExamPlannerPage onNavigate={navigateTo} />
            </ProGate>
          </ProtectedRoute>
        )}
        {currentPage === 'resume' && (
          <ProtectedRoute user={user} profile={profile} currentPage={currentPage} onRedirect={navigateTo}>
            <ProGate feature="Resume Builder" onNavigatePricing={navigateTo}>
              <ResumeBuilderPage onNavigate={navigateTo} />
            </ProGate>
          </ProtectedRoute>
        )}
      </div>

      {/* Global Cinematic Overlay */}
      <ZenMode />

      {/* Command Palette (Ctrl+K) */}
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
