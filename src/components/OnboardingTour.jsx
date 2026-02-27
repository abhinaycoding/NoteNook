import React, { useState, useEffect, useRef } from 'react'

const TOUR_STEPS = [
  {
    target: '.dash-grid',
    title: 'Your Canvas',
    desc: 'This is your personal dashboard. All your tools live here — timer, tasks, analytics, and notes.',
    position: 'bottom',
  },
  {
    target: '.timer-widget',
    title: 'The Chronos Timer',
    desc: 'Start a focus session with 25, 45, or 60-minute presets. Sessions are logged to your analytics automatically.',
    position: 'bottom',
  },
  {
    target: '.ledger-container, .add-task-trigger',
    title: 'The Ledger',
    desc: 'Add tasks, set priorities, and check them off. Your daily planning starts here.',
    position: 'top',
  },
  {
    target: '.desktop-nav, .mobile-nav-toggle',
    title: 'Navigate Anywhere',
    desc: 'Access Analytics, Goals, Exams, Resume Builder, and more from the top navigation.',
    position: 'bottom',
  },
]

const OnboardingTour = ({ onComplete }) => {
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const tooltipRef = useRef(null)

  const current = TOUR_STEPS[step]

  useEffect(() => {
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

    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem('ff_onboarding_done', 'true')
      onComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem('ff_onboarding_done', 'true')
    onComplete()
  }

  // Tooltip positioning
  const tooltipStyle = (() => {
    const style = { position: 'absolute', zIndex: 100010 }
    const pad = 16

    if (current.position === 'bottom') {
      style.top = pos.top + pos.height + pad
      style.left = pos.left + pos.width / 2
      style.transform = 'translateX(-50%)'
    } else {
      style.top = pos.top - pad
      style.left = pos.left + pos.width / 2
      style.transform = 'translate(-50%, -100%)'
    }

    return style
  })()

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100005,
        background: 'rgba(0,0,0,0.55)',
        transition: 'opacity 0.3s ease',
      }} onClick={handleSkip} />

      {/* Spotlight cutout */}
      <div style={{
        position: 'absolute', zIndex: 100006,
        top: pos.top - 8, left: pos.left - 8,
        width: pos.width + 16, height: pos.height + 16,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
        borderRadius: '4px',
        border: '2px solid var(--primary)',
        pointerEvents: 'none',
        transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
      }} />

      {/* Tooltip */}
      <div ref={tooltipRef} style={tooltipStyle}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--text-primary)',
          boxShadow: '4px 4px 0px var(--text-primary)',
          padding: '1.25rem 1.5rem',
          maxWidth: '320px',
          minWidth: '260px',
          fontFamily: 'var(--font-sans)',
        }}>
          {/* Step counter */}
          <div style={{
            fontSize: '0.6rem', textTransform: 'uppercase',
            letterSpacing: '0.15em', color: 'var(--text-secondary)',
            marginBottom: '0.5rem', fontWeight: 700,
          }}>
            Step {step + 1} of {TOUR_STEPS.length}
          </div>

          {/* Title */}
          <div style={{
            fontFamily: 'var(--font-serif)', fontSize: '1.25rem',
            marginBottom: '0.5rem', color: 'var(--text-primary)',
          }}>
            {current.title}
          </div>

          {/* Desc */}
          <p style={{
            fontSize: '0.8rem', lineHeight: 1.5,
            color: 'var(--text-secondary)', marginBottom: '1rem',
          }}>
            {current.desc}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={handleSkip}
              style={{
                fontSize: '0.65rem', textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'var(--text-secondary)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              style={{
                fontSize: '0.7rem', textTransform: 'uppercase',
                letterSpacing: '0.1em', fontWeight: 700,
                background: 'var(--text-primary)', color: 'var(--bg-card)',
                border: 'none', padding: '0.5rem 1.25rem',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default OnboardingTour
