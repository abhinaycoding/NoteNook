import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from '../contexts/LanguageContext'
import './OnboardingTour.css'

const OnboardingTour = ({ onComplete }) => {
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [animKey, setAnimKey] = useState(0) // forces re-animation on step change
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const tooltipRef = useRef(null)
  const { t } = useTranslation()

  const TOUR_STEPS = [
    {
      target: '.dash-grid',
      title: t('tour.step1Title'),
      desc: t('tour.step1Desc'),
      position: 'bottom',
      emoji: '🎨',
    },
    {
      target: '.timer-widget',
      title: t('tour.step2Title'),
      desc: t('tour.step2Desc'),
      position: 'bottom',
      emoji: '⏱',
    },
    {
      target: '.ledger-container, .add-task-trigger',
      title: t('tour.step3Title'),
      desc: t('tour.step3Desc'),
      position: 'top',
      emoji: '📋',
    },
    {
      target: '.desktop-nav, .mobile-nav-toggle',
      title: t('tour.step4Title'),
      desc: t('tour.step4Desc'),
      position: 'bottom',
      emoji: '🧭',
    },
  ]

  const current = TOUR_STEPS[step]

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const updatePos = useCallback(() => {
    const selectors = current.target.split(',').map(s => s.trim())
    let el = null
    for (const sel of selectors) {
      el = document.querySelector(sel)
      if (el) break
    }
    if (!el) { handleNext(); return }

    const rect = el.getBoundingClientRect()
    setPos({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    })
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    setAnimKey(k => k + 1)
    const timer = setTimeout(updatePos, 80) // small delay for scroll
    return () => clearTimeout(timer)
  }, [step, updatePos])

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleSkip()
    }
  }

  const handleSkip = () => {
    localStorage.setItem('ff_onboarding_done', 'true')
    onComplete()
  }

  // Compute tooltip position
  const tooltipStyle = (() => {
    if (isMobile) return {} // CSS handles fixed positioning on mobile

    const pad = 18
    const style = {}

    if (current.position === 'bottom') {
      style.top = pos.top + pos.height + pad
      style.left = pos.left + pos.width / 2
      style.transform = 'translateX(-50%)'
    } else {
      style.top = pos.top - pad
      style.left = pos.left + pos.width / 2
      style.transform = 'translate(-50%, -100%)'
    }

    // Keep within viewport horizontally
    style.maxWidth = '300px'
    return style
  })()

  return (
    <>
      {/* Dimmed overlay */}
      <div className="tour-overlay" onClick={handleSkip} />

      {/* Spotlight ring around the target element */}
      <div
        className="tour-spotlight"
        style={{
          top: pos.top - 8,
          left: pos.left - 8,
          width: pos.width + 16,
          height: pos.height + 16,
        }}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        key={animKey}
        className={`tour-tooltip ${current.position === 'top' ? 'pos-top' : ''}`}
        style={tooltipStyle}
      >
        <div className="tour-card">
          {/* Step & progress dots */}
          <div className="tour-step-badge">
            <span>{t('tour.step')} {step + 1} {t('tour.of')} {TOUR_STEPS.length}</span>
            <div className="tour-progress-dots">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`tour-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Emoji + Title */}
          <div className="tour-title">
            {current.emoji && <span style={{ marginRight: '0.4rem' }}>{current.emoji}</span>}
            {current.title}
          </div>

          {/* Description */}
          <p className="tour-desc">{current.desc}</p>

          {/* Actions */}
          <div className="tour-actions">
            <button className="tour-skip-btn" onClick={handleSkip}>
              {t('tour.skipTour')}
            </button>
            <button className="tour-next-btn" onClick={handleNext}>
              <span>{step === TOUR_STEPS.length - 1 ? t('tour.finish') : t('tour.next')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default OnboardingTour
