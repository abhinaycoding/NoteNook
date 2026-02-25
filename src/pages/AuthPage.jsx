import React, { useState } from 'react'
import Navigation from '../components/Navigation'
import { useAuth } from '../contexts/AuthContext'

const AuthPage = ({ onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { setLocalSession } = useAuth()

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
        
        console.log('[Auth] Login complete. Setting local session directly...')
        await setLocalSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in
        }, data.user)
        
        console.log('[Auth] Navigating to dashboard...')
        onNavigate('dashboard')
      } else {
        console.log('[Auth] Calling native signup endpoint...')
        const res = await fetch(`${url}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email, 
            password,
            data: { full_name: fullName }
          })
        })
        
        const data = await res.json()
        if (!res.ok) throw new Error(data.msg || data.message || 'Signup failed')
        
        setSuccessMsg('Registration successful. Please check your email to verify your account or proceed to login.')
        
        if (data.session) {
          await setLocalSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          }, data.user)
          onNavigate('dashboard')
        }
      }
    } catch (error) {
      console.error('[Auth] Exception caught:', error)
      setErrorMsg(error?.message || String(error) || 'Unknown error occurred')
    } finally {
      setLoading(false)
      console.log('[Auth] Process finished, loading set to false.')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${url}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.msg || data.message || 'Failed to send reset email')
      }
      
      setSuccessMsg('Password reset instructions sent. Please check your email to create a new password.')
    } catch (error) {
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderHeading = () => {
    if (isResetPassword) return 'Reset Pass.'
    return isLogin ? 'Enter the Canvas.' : 'Procure Pass.'
  }

  const renderSubheading = () => {
    if (isResetPassword) return 'Recover your access'
    return isLogin ? 'Authenticate your credentials' : 'Join the distraction-free ledger'
  }

  return (
    <div className="landing-page min-h-screen flex flex-col">
      <Navigation onNavigate={onNavigate} isAuthPage={true} />
      
      <main className="flex-grow flex items-center justify-center py-20">
        <div className="container max-w-lg mt-12 mb-20">
          
          <div className="border border-ink p-16 bg-cream relative">
            <h2 className="text-5xl font-serif mb-4 text-center">
              {renderHeading()}
            </h2>
            <p className="text-xs text-muted text-center uppercase tracking-widest mb-12">
              {renderSubheading()}
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

            {isResetPassword ? (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
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

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full mt-8 justify-center py-4 text-sm"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            ) : (
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
                  <div className="flex justify-between items-end">
                    <label className="text-xs uppercase tracking-widest font-bold">Password</label>
                    {isLogin && (
                      <button 
                        type="button"
                        onClick={() => setIsResetPassword(true)}
                        className="text-[10px] uppercase tracking-widest text-muted hover:text-primary transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
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
                  className="btn-primary w-full mt-8 justify-center py-4 text-sm cursor-pointer hover:bg-primary transition-colors"
                >
                  {loading ? 'Authenticating...' : (isLogin ? 'Log In' : 'Sign Up')}
                </button>
              </form>
            )}

            <div className="mt-12 text-center flex flex-col gap-4">
              {isResetPassword && (
                <button 
                  onClick={() => setIsResetPassword(false)} 
                  className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors hover:italic cursor-pointer"
                >
                  Return to Pass Authentication.
                </button>
              )}
              
              {!isResetPassword && (
                <button 
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors hover:italic cursor-pointer"
                >
                  {isLogin ? "Don't have a pass? Sign up here." : "Already have a pass? Log in."}
                </button>
              )}
            </div>

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

export default AuthPage
