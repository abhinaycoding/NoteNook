import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'

const ProfileSetup = ({ onNavigate, user }) => {
  const [studentType, setStudentType] = useState('High School')
  const [targetExam, setTargetExam] = useState('')
  const [goals, setGoals] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          student_type: studentType,
          target_exam: targetExam,
          goals: goals,
          updated_at: new Date()
        })
        .eq('id', user.id)

      if (error) throw error
      
      // Update successful, force hard navigation or simple component swap
      onNavigate('dashboard')
      // A full page reload might be better here to re-trigger the AuthContext fetch cleanly
      window.location.reload()
    } catch (error) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="landing-page min-h-screen flex flex-col">
      <Navigation onNavigate={onNavigate} isAuthPage={true} />
      
      <main className="flex-grow flex items-center justify-center py-20">
        <div className="container max-w-lg mt-12 mb-20">
          
          <div className="border border-ink p-16 bg-cream relative">
            <h2 className="text-4xl font-serif mb-4 text-center">
              The Ledger Awaits.
            </h2>
            <p className="text-xs text-muted text-center uppercase tracking-widest mb-12">
              Configure your academic profile
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 border border-ink text-primary text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-8">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold">Current Status</label>
                <select 
                  value={studentType} 
                  onChange={(e) => setStudentType(e.target.value)}
                  className="w-full bg-transparent border-b border-ink font-serif text-xl outline-none py-3 focus:border-primary transition-colors cursor-pointer appearance-none"
                >
                  <option value="High School">High School</option>
                  <option value="University">University</option>
                  <option value="Competitive Exam">Competitive Exam</option>
                  <option value="Professional Development">Professional Development</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold">Target Exam / Core Subject</label>
                <input 
                  type="text" 
                  required 
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full bg-transparent border-b border-ink font-serif text-xl outline-none py-3 focus:border-primary transition-colors"
                  placeholder="e.g. JEE, NEET, Bar Exam, Calculus"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold">Primary Goal</label>
                <textarea 
                  required 
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full bg-transparent border-b border-ink font-serif text-xl outline-none py-3 focus:border-primary transition-colors resize-none h-24"
                  placeholder="e.g. Score 99 percentile, maintain 3.8 GPA"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full mt-4 justify-center py-4 text-sm uppercase tracking-widest"
              >
                {loading ? 'Initializing...' : 'Complete Registration'}
              </button>
            </form>

          </div>
        </div>
      </main>

      <footer className="container py-8 flex justify-between uppercase tracking-widest text-xs font-bold border-t border-ink mt-auto">
        <div>FocusFlow Publishing © 2026</div>
        <div>All Rights Reserved</div>
      </footer>
    </div>
  )
}

export default ProfileSetup
