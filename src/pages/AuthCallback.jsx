import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Loader from '../components/Loader'

const AuthCallback = () => {
  const { user } = useAuth()
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('[AuthCallback] Processing OAuth redirect...')
        
        // 1. Let Supabase natively attempt to process the URL hash/search params
        // We just call getSession to force the client to evaluate the URL
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AuthCallback] Supabase Error:', error)
          setErrorMsg(error.message)
          setTimeout(() => window.location.href = '/', 3000)
          return
        }

        // The Supabase client will automatically fire the onAuthStateChange event in AuthContext
        // We just need to give it a second and then redirect to the dashboard
        console.log('[AuthCallback] Session processed. Redirecting to Dashboard...')
        setTimeout(() => {
          window.location.href = '/?route=dashboard' // Hard redirect to clear URL history
        }, 1500)
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err)
        setErrorMsg('Authentication failed. Redirecting...')
        setTimeout(() => window.location.href = '/', 3000)
      }
    }

    processCallback()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream font-serif text-ink">
      <Loader />
      <div className="mt-8 text-center">
        <h2 className="text-2xl mb-2">Authenticating...</h2>
        <p className="text-muted text-sm uppercase tracking-widest">Please wait while we secure your canvas.</p>
        
        {errorMsg && (
          <div className="mt-8 p-4 border border-red-500/50 bg-red-900/10 text-red-500 text-xs">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthCallback
