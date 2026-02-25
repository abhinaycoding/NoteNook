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
import CustomCursor from './components/CustomCursor'
import ProGate from './components/ProGate'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const { user, profile } = useAuth()
  const { isDark, toggle } = useTheme()

  const navigateTo = (page) => {
    const protectedPages = ['dashboard', 'setup', 'library', 'analytics', 'exams', 'goals', 'resume', 'pricing']
    if (protectedPages.includes(page) && !user) {
      setCurrentPage('auth')
      return
    }
    setCurrentPage(page)
  }

  const PROTECTED = ['dashboard', 'setup', 'library', 'analytics', 'exams', 'goals', 'resume', 'pricing']

  useEffect(() => {
    if (!user && PROTECTED.includes(currentPage)) {
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

      {/* Floating theme toggle */}
      <button
        className="theme-toggle"
        onClick={toggle}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        {isDark ? '☀' : '☽'}
      </button>

      {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
      {currentPage === 'auth' && <AuthPage onNavigate={navigateTo} />}
      {currentPage === 'setup' && user && <ProfileSetup onNavigate={navigateTo} user={user} />}
      {currentPage === 'dashboard' && user && <Dashboard onNavigate={navigateTo} />}
      {currentPage === 'library' && user && <LibraryPage onNavigate={navigateTo} user={user} />}
      {currentPage === 'analytics' && user && <AnalyticsPage onNavigate={navigateTo} />}
      {currentPage === 'goals' && user && <GoalsPage onNavigate={navigateTo} />}
      {currentPage === 'pricing' && user && <PricingPage onNavigate={navigateTo} />}

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
    </>
  )
}

export default App
