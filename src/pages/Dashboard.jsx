import React from 'react'
import TaskPlanner from '../components/TaskPlanner'
import NotesPreview from '../components/NotesPreview'
import FocusTimer from '../components/FocusTimer'
import AnalyticsCards from '../components/AnalyticsCards'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'

const Dashboard = ({ onNavigate }) => {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    onNavigate('landing')
  }

  return (
    <div className="canvas-layout">
      {/* Editorial Header */}
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-4">
          <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('landing')}>FF.</div>
          <div className="flex gap-8 items-end text-right">
            <div>
              <div className="uppercase tracking-widest text-xs font-bold font-serif italic">Edition: Personal</div>
              <div className="uppercase tracking-widest text-xs mt-1">Reader: {user?.user_metadata?.full_name || 'Scholar'}</div>
            </div>
            <button onClick={() => onNavigate('analytics')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">Analytics</button>
            <button onClick={() => onNavigate('exams')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">Exams</button>
            <button onClick={() => onNavigate('goals')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">Goals</button>
            <button onClick={() => onNavigate('resume')} className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer">Resume</button>
            <button 
              onClick={handleLogout}
              className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="canvas-main container mt-12 pb-20">
        
        {/* Top Section: Timer & Analytics */}
        <section className="ed-section flex gap-12 mb-12 border-b border-ink pb-12">
          <div className="w-1/2 flex flex-col">
            <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-muted">Chronos (Timer)</h2>
            <div className="flex-grow">
              <FocusTimer />
            </div>
          </div>
          
          <div className="w-1px bg-ink"></div> {/* Divider */}
          
          <div className="w-1/2 flex flex-col">
            <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-muted">Metrics</h2>
            <div className="flex-grow">
              <AnalyticsCards />
            </div>
          </div>
        </section>

        {/* Bottom Section: Notes & Tasks */}
        <section className="ed-section flex gap-12">
          <div className="w-2/3">
            <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-muted">The Ledger</h2>
            <TaskPlanner />
          </div>
          
          <div className="w-1/3 border-l border-ink pl-12 line-left">
            <h2 className="text-sm uppercase tracking-widest font-bold mb-6 text-muted">Archives</h2>
            <NotesPreview onNavigate={onNavigate} />
          </div>
        </section>

      </main>
    </div>
  )
}

export default Dashboard
