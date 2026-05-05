import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const SESSION_KEY = 'notenook_session_id'

const createSessionId = () => {
  const random = Math.random().toString(36).slice(2, 10)
  return `nn_${Date.now()}_${random}`
}

const getSessionId = () => {
  if (typeof window === 'undefined') {
    return 'server'
  }

  try {
    const existing = window.localStorage.getItem(SESSION_KEY)
    if (existing) return existing

    const next = createSessionId()
    window.localStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return createSessionId()
  }
}

const getPagePath = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.location?.pathname || null
}

export const trackEvent = async (eventName, data = {}) => {
  if (!eventName) return

  const { userId = null, ...meta } = data

  try {
    await addDoc(collection(db, 'analytics_events'), {
      event_name: eventName,
      user_id: userId,
      session_id: getSessionId(),
      page_path: getPagePath(),
      metadata: meta,
      created_at: serverTimestamp(),
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] event dropped:', eventName, error)
    }
  }
}
