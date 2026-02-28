import React, { createContext, useContext, useState, useCallback } from 'react'
import en from '../i18n/en.json'
import hi from '../i18n/hi.json'
import es from '../i18n/es.json'

const translations = { en, hi, es }

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

const LanguageContext = createContext()

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

function detectBrowserLanguage() {
  const saved = localStorage.getItem('ff_language')
  if (saved && translations[saved]) return saved

  const browserLang = navigator.language?.slice(0, 2)
  if (browserLang && translations[browserLang]) return browserLang

  return 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectBrowserLanguage)

  const setLanguage = useCallback((code) => {
    if (translations[code]) {
      setLanguageState(code)
      localStorage.setItem('ff_language', code)
    }
  }, [])

  const t = useCallback((key) => {
    const value = getNestedValue(translations[language], key)
    if (value !== undefined) return value

    // Fallback to English
    const fallback = getNestedValue(translations.en, key)
    if (fallback !== undefined) return fallback

    // Return the key itself as last resort
    return key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
