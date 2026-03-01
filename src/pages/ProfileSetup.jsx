import Navigation from '../components/Navigation'
import { ARCHETYPES } from '../constants/archetypes'
import { useTranslation } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useState } from 'react' // Added missing import for useState

const ProfileSetup = ({ onNavigate }) => {
  const { t } = useTranslation()
  const { user, profile, refreshProfile } = useAuth()
  
  const [studentType, setStudentType] = useState(profile?.student_type || 'High School')
  const [targetExam, setTargetExam] = useState(profile?.target_exam || '')
  const [goals, setGoals] = useState(profile?.goals || '')
  const [avatarId, setAvatarId] = useState(profile?.avatar_id || 'owl')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const payload = {
        student_type: studentType,
        target_exam: targetExam,
        goals: goals,
        avatar_id: avatarId,
        updated_at: new Date().toISOString()
      }

      if (!user?.id) throw new Error('No user ID found! Are you logged out?')

      // Because the auth trigger already created the profile row with the user ID,
      // we must UPDATE it, not UPSERT it. Upserting triggers RLS insert blocks.
      const response = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)

      if (response.error) {
        throw new Error(`Failed to save: ${response.error.message}`)
      }
      
      await refreshProfile()
      onNavigate('dashboard')

    } catch (error) {
      console.error('Profile save error:', error)
      setErrorMsg(error.message || 'An error occurred while saving your profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation onNavigate={onNavigate} isAuthPage={true} />
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', marginTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ width: '100%', maxWidth: '540px', border: '1px solid var(--ink)', padding: '3rem', background: 'var(--bg-card)' }}>
          
          <h2 className="text-4xl font-serif text-center" style={{ marginBottom: '0.5rem' }}>
            {t('profile.title') || 'The Ledger Awaits.'}
          </h2>
          <p className="text-xs text-center text-muted uppercase tracking-widest" style={{ marginBottom: '2.5rem' }}>
            {t('profile.subtitle') || 'Configure your academic profile'}
          </p>

          {errorMsg && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500, wordBreak: 'break-all' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="text-xs uppercase tracking-widest font-bold">Current Status</label>
              <select 
                value={studentType} 
                onChange={(e) => setStudentType(e.target.value)}
                style={{ width: '100%', background: 'transparent', borderBottom: '1px solid var(--ink)', padding: '0.5rem 0', outline: 'none', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', appearance: 'none', borderRadius: 0, cursor: 'pointer' }}
              >
                <option value="High School" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>High School</option>
                <option value="University" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>University</option>
                <option value="Competitive Exam" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Competitive Exam</option>
                <option value="Professional Development" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Professional Development</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="text-xs uppercase tracking-widest font-bold">Target Exam / Core Subject</label>
              <input 
                type="text" 
                required 
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                style={{ width: '100%', background: 'transparent', borderBottom: '1px solid var(--ink)', padding: '0.5rem 0', outline: 'none', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                placeholder="e.g. JEE, NEET, Bar Exam, Calculus"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="text-xs uppercase tracking-widest font-bold">Primary Goal</label>
              <textarea 
                required 
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                style={{ width: '100%', background: 'transparent', borderBottom: '1px solid var(--ink)', padding: '0.5rem 0', outline: 'none', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, resize: 'none', minHeight: '80px' }}
                placeholder="e.g. Score 99 percentile, maintain 3.8 GPA"
              />
            </div>

              <div className="flex flex-col gap-4">
                <label className="text-xs uppercase tracking-widest font-bold">{t('profile.choosePersona')}</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.75rem',
                }}>
                  {ARCHETYPES.map((arch) => {
                    const isSelected = avatarId === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => setAvatarId(arch.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1.25rem 0.75rem',
                          border: isSelected ? `2px solid ${arch.accent}` : '2px solid var(--border, #e5e5e5)',
                          borderRadius: '12px',
                          background: isSelected 
                            ? `linear-gradient(135deg, ${arch.accent}15, ${arch.accent}08)` 
                            : 'var(--surface, #fff)',
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                          boxShadow: isSelected 
                            ? `0 4px 20px ${arch.accent}30, 0 0 0 1px ${arch.accent}20` 
                            : '0 1px 3px rgba(0,0,0,0.06)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.1)`;
                            e.currentTarget.style.borderColor = arch.accent + '80';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                            e.currentTarget.style.borderColor = 'var(--border, #e5e5e5)';
                          }
                        }}
                      >
                        {/* Accent dot indicator */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: arch.accent,
                            boxShadow: `0 0 6px ${arch.accent}`,
                          }} />
                        )}
                        <span style={{ 
                          fontSize: '2rem', 
                          marginBottom: '0.5rem',
                          filter: isSelected ? 'none' : 'grayscale(30%)',
                          transition: 'filter 0.2s ease',
                        }}>{arch.emoji}</span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.04em',
                          textAlign: 'center',
                          color: isSelected ? arch.accent : 'var(--text-primary, #333)',
                          transition: 'color 0.2s ease',
                        }}>{arch.name}</span>
                        <span style={{ 
                          fontSize: '0.6rem', 
                          color: 'var(--text-secondary, #888)',
                          marginTop: '0.25rem',
                          textAlign: 'center',
                          opacity: isSelected ? 1 : 0.7,
                        }}>{arch.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ marginTop: '1rem', padding: '1.25rem 1.5rem', background: 'var(--ink)', color: 'var(--bg-card)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', transition: 'background 0.2s ease', width: '100%' }}
              >
                {loading ? t('profile.initializing') || 'Initializing...' : t('profile.completeRegistration') || 'Complete Registration'}
              </button>
            </form>

        </div>
      </main>

      <footer style={{ padding: '2rem 5%', display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: 700, borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <div>NoteNook Publishing © 2026</div>
        <div>All Rights Reserved</div>
      </footer>
    </div>
  )
}

export default ProfileSetup
