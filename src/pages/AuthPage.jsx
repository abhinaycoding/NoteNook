import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'

const AuthPage = ({ onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // App.jsx will automatically see the session change and we can handle routing there, 
        // or just navigate directly here.
        onNavigate('dashboard')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })
        if (error) throw error
        setSuccessMsg('Registration successful. Please check your email to verify your account or proceed to login.')
        if(!error) {
           // If email confirmation is off, they are logged in immediately.
           supabase.auth.getSession().then(({data}) => {
             if(data.session) onNavigate('dashboard')
           })
        }
      }
    } catch (error) {
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth', // Ensure they come back here
      })
      if (error) throw error
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
              <div className="mb-6 p-4 border border-ink text-primary text-sm font-medium">
                {errorMsg}
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
                  className="btn-primary w-full mt-8 justify-center py-4 text-sm"
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
