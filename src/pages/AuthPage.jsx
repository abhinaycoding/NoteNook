import React, { useState } from 'react'
import Navigation from '../components/Navigation'
import { useTranslation } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'

const AuthPage = ({ onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { t } = useTranslation()



  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // onAuthStateChange SIGNED_IN fires → AuthContext sets user+profile → App.jsx navigates
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        if (data?.user?.identities?.length === 0) {
          throw new Error(t('auth.accountExists'))
        }
        // Sign out immediately so user must verify email then log in
        if (data.session) await supabase.auth.signOut()

        setSuccessMsg(t('auth.signupSuccess'))
        setEmail('')
        setPassword('')
        setFullName('')
        setTimeout(() => setIsLogin(true), 100)
      }
    } catch (error) {
      setErrorMsg(error?.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-page min-h-screen flex flex-col">
      <Navigation onNavigate={onNavigate} isAuthPage={true} />

      <main className="flex-grow flex items-center justify-center py-20">
        <div className="container max-w-lg mt-12 mb-20">

          <div className="border border-ink p-16 bg-cream relative">
            <h2 className="text-5xl font-serif mb-4 text-center">
              {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
            </h2>
            <p className="text-xs text-muted text-center uppercase tracking-widest mb-12">
              {isLogin ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 border border-red-500/50 bg-red-900/10 text-red-400 text-sm font-medium">
                <strong>{t('auth.authError')}</strong> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 border border-ink text-accent text-sm font-medium">
                {successMsg}
              </div>
            )}



            <form onSubmit={handleAuth} className="flex flex-col gap-6">
              {!isLogin && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest font-bold">{t('auth.fullName')}</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent border-b border-ink font-serif text-2xl outline-none py-3 focus:border-primary transition-colors"
                    placeholder={t('auth.fullNamePlaceholder')}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold">{t('auth.email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-ink font-serif text-2xl outline-none py-3 focus:border-primary transition-colors"
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-ink font-serif text-2xl outline-none py-3 focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-4 justify-center py-4 text-sm cursor-pointer hover:bg-primary transition-colors"
              >
                {loading ? t('auth.authenticating') : (isLogin ? t('auth.logInBtn') : t('auth.signUpBtn'))}
              </button>
            </form>

            <div className="mt-12 text-center flex flex-col gap-4">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors hover:italic cursor-pointer"
              >
                {isLogin ? t('auth.noPassSignup') : t('auth.havePassLogin')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="container py-8 flex justify-between uppercase tracking-widest text-xs font-bold border-t border-ink mt-auto">
        <div>{t('auth.copyright')} © 2026</div>
        <div>{t('auth.allRights')}</div>
      </footer>
    </div>
  )
}

export default AuthPage
