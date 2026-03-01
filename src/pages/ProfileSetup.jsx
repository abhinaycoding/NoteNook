import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { ARCHETYPES } from '../constants/archetypes'
import { useTranslation } from '../contexts/LanguageContext'

const ProfileSetup = ({ onNavigate, user }) => {
  const { t } = useTranslation()
  const [studentType, setStudentType] = useState('High School')
  const [targetExam, setTargetExam] = useState('')
  const [goals, setGoals] = useState('')
  const [avatarId, setAvatarId] = useState('owl')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          student_type: studentType,
          target_exam: targetExam,
          goals: goals,
          avatar_id: avatarId,
          updated_at: new Date()
        }, { onConflict: 'id' })

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
              {t('profile.title')}
            </h2>
            <p className="text-xs text-muted text-center uppercase tracking-widest mb-12">
              {t('profile.subtitle')}
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 border border-ink text-primary text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-8">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold">{t('profile.currentStatus')}</label>
                <select 
                  value={studentType} 
                  onChange={(e) => setStudentType(e.target.value)}
                  className="w-full bg-transparent border-b border-ink font-serif text-xl outline-none py-3 focus:border-primary transition-colors cursor-pointer appearance-none"
                >
                  <option value="High School">{t('profile.highSchool')}</option>
                  <option value="University">{t('profile.university')}</option>
                  <option value="Competitive Exam">{t('profile.competitiveExam')}</option>
                  <option value="Professional Development">{t('profile.professionalDev')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold">{t('profile.targetExam')}</label>
                <input 
                  type="text" 
                  required 
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full bg-transparent border-b border-ink font-serif text-xl outline-none py-3 focus:border-primary transition-colors"
                  placeholder={t('profile.targetPlaceholder')}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold">{t('profile.primaryGoal')}</label>
                <textarea 
                  required 
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full bg-transparent border-b border-ink font-serif text-xl outline-none py-3 focus:border-primary transition-colors resize-none h-24"
                  placeholder={t('profile.goalPlaceholder')}
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
                className="btn-primary w-full mt-4 justify-center py-4 text-sm uppercase tracking-widest"
              >
                {loading ? t('profile.initializing') : t('profile.completeRegistration')}
              </button>
            </form>

          </div>
        </div>
      </main>

      <footer className="container py-8 flex justify-between uppercase tracking-widest text-xs font-bold border-t border-ink mt-auto">
        <div>NoteNook Publishing © 2026</div>
        <div>{t('auth.allRights')}</div>
      </footer>
    </div>
  )
}

export default ProfileSetup
