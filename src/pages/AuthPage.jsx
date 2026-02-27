import React, { useState } from 'react'
import Navigation from '../components/Navigation'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Loader from '../components/Loader'

const AuthPage = ({ onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [showLoader, setShowLoader] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { setLocalSession } = useAuth()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      })
      if (error) throw error
    } catch (error) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    console.log('[Auth] Starting native auth process. isLogin:', isLogin)

    try {
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (isLogin) {
        console.log('[Auth] Calling native login endpoint...')
        const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })
        
        const data = await res.json()
        if (!res.ok) throw new Error(data.error_description || data.msg || data.message || 'Login failed')
        
        console.log('[Auth] Showing loader before navigating to dashboard...')
        setShowLoader(true)

        setTimeout(async () => {
          console.log('[Auth] Login complete. Setting local session directly...')
          await setLocalSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in
          }, data.user)
        }, 2500)
      } else {
        console.log('[Auth] Calling Supabase signUp...')
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
          throw new Error('An account with this email already exists. Please log in instead.')
        }

        if (data.session) {
          await supabase.auth.signOut()
        }

        setSuccessMsg('✓ Account created! Please check your inbox for a verification email and click the link to activate your account. Then come back and log in.')
        setEmail('')
        setPassword('')
        setFullName('')
        setTimeout(() => setIsLogin(true), 100)
      }
    } catch (error) {
      console.error('[Auth] Exception caught:', error)
      setErrorMsg(error?.message || String(error) || 'Unknown error occurred')
    } finally {
      setLoading(false)
      console.log('[Auth] Process finished, loading set to false.')
    }
  }

  return (
    <div className="landing-page min-h-screen flex flex-col">
      {showLoader && <Loader />}
      
      <Navigation onNavigate={onNavigate} isAuthPage={true} />
      
      <main className="flex-grow flex items-center justify-center py-20">
        <div className="container max-w-lg mt-12 mb-20">
          
          <div className="border border-ink p-16 bg-cream relative">
            <h2 className="text-5xl font-serif mb-4 text-center">
              {isLogin ? 'Enter the Canvas.' : 'Procure Pass.'}
            </h2>
            <p className="text-xs text-muted text-center uppercase tracking-widest mb-12">
              {isLogin ? 'Authenticate your credentials' : 'Join the distraction-free ledger'}
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 border border-red-500/50 bg-red-900/10 text-red-400 text-sm font-medium">
                <strong>Auth Error:</strong> {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="mb-6 p-4 border border-ink text-accent text-sm font-medium">
                {successMsg}
              </div>
            )}

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="google-sign-in-btn"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{loading ? 'Connecting...' : (isLogin ? 'Continue with Google' : 'Sign up with Google')}</span>
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-6">
                {!isLogin && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-widest font-bold">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent border-b border-ink font-serif text-2xl outline-none py-3 focus:border-primary transition-colors"
                      placeholder="Your Name"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest font-bold">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-ink font-serif text-2xl outline-none py-3 focus:border-primary transition-colors"
                    placeholder="scholar@example.com"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest font-bold">Password</label>
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
                  {loading ? 'Authenticating...' : (isLogin ? 'Log In' : 'Sign Up')}
                </button>
              </form>

            <div className="mt-12 text-center flex flex-col gap-4">
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors hover:italic cursor-pointer"
              >
                {isLogin ? "Don't have a pass? Sign up here." : "Already have a pass? Log in."}
              </button>
            </div>

          </div>
        </div>
      </main>

      <footer className="container py-8 flex justify-between uppercase tracking-widest text-xs font-bold border-t border-ink mt-auto">
        <div>NoteNook Publishing © 2026</div>
        <div>All Rights Reserved</div>
      </footer>

    </div>
  )
}

export default AuthPage

