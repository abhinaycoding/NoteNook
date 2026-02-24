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
import CustomCursor from './components/CustomCursor'
import { useAuth } from './contexts/AuthContext'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const { user, profile } = useAuth()

  const navigateTo = (page) => {
    // Basic route protection
    if ((page === 'dashboard' || page === 'setup' || page === 'library' || page === 'analytics' || page === 'exams' || page === 'goals' || page === 'resume') && !user) {
      setCurrentPage('auth')
      return
    }
    setCurrentPage(page)
  }

  // Auto-redirect and profile enforcement
  useEffect(() => {
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
      {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
      {currentPage === 'auth' && <AuthPage onNavigate={navigateTo} />}
      {currentPage === 'setup' && user && <ProfileSetup onNavigate={navigateTo} user={user} />}
      {currentPage === 'dashboard' && user && <Dashboard onNavigate={navigateTo} />}
      {currentPage === 'library' && user && <LibraryPage onNavigate={navigateTo} user={user} />}
      {currentPage === 'analytics' && user && <AnalyticsPage onNavigate={navigateTo} />}
      {currentPage === 'exams' && user && <ExamPlannerPage onNavigate={navigateTo} />}
      {currentPage === 'goals' && user && <GoalsPage onNavigate={navigateTo} />}
      {currentPage === 'resume' && user && <ResumeBuilderPage onNavigate={navigateTo} />}
    </>
  )
}

export default App
