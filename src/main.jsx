import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { PlanProvider } from './contexts/PlanContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ZenProvider } from './contexts/ZenContext'
import { TimerProvider } from './contexts/TimerContext'
import { LanguageProvider } from './contexts/LanguageContext'

// RAW URL DIAGNOSTIC BEFORE SUPABASE INITIALIZATION
const rawUrl = window.location.href
if (rawUrl.includes('access_token') || rawUrl.includes('code') || rawUrl.includes('debug=true')) {
  localStorage.setItem('ff_raw_url', rawUrl)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <PlanProvider>
              <TimerProvider>
                <ZenProvider>
                  <NotificationProvider>
                    <App />
                  </NotificationProvider>
                </ZenProvider>
              </TimerProvider>
            </PlanProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)

