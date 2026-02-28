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

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
  </StrictMode>,
)

