import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useZen } from '../contexts/ZenContext'
import { useTimer } from '../contexts/TimerContext'
import { useTranslation } from '../contexts/LanguageContext'
import Confetti from './Confetti'
import BreathingGuide from './BreathingGuide'
import './FocusTimer.css'

const FocusTimer = () => {
  const { user } = useAuth()
  const toast = useToast()
  const { enterZenMode } = useZen()
  const { t } = useTranslation()
  const {
    selectedMinutes,
    secondsLeft,
    isRunning,
    isComplete,
    sessionSaved,
    start,
    pause,
    reset,
    changePreset,
    PRESETS
  } = useTimer()
  
  const [showConfetti, setShowConfetti] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const prevDone = useRef(false)

  // Attach keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: ' ', // Space
      action: () => {
        if (isComplete) reset()
        else if (isRunning) pause()
        else start()
      }
    }
  ])

  // Trigger confetti on session complete
  useEffect(() => {
    if (isComplete && !prevDone.current) {
      setTimeout(() => setShowConfetti(true), 0)
      setTimeout(() => setShowConfetti(false), 3500)
    }
    prevDone.current = isComplete
  }, [isComplete])

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const ss = (secondsLeft % 60).toString().padStart(2, '0')
  const progress = (selectedMinutes * 60 - secondsLeft) / (selectedMinutes * 60)
  const label = isComplete ? t('timer.restart') : (secondsLeft < selectedMinutes * 60 && !isRunning) ? t('timer.resume') : t('timer.commence')
  const stateLabel = isComplete ? t('timer.done') : isRunning ? t('timer.on') : t('timer.idle')

  // SVG arc
  const R = 44
  const CIRC = 2 * Math.PI * R
  const offset = CIRC * (1 - progress)

  const digitClass = [
    'timer-digits',
    isRunning ? 'timer-digits--running' : '',
    isComplete ? 'timer-digits--done' : '',
  ].join(' ')

  return (
    <div className="timer-widget">
      <Confetti active={showConfetti} />

      {/* Preset chips and Zen Mode trigger */}
      <div className="timer-presets" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {PRESETS.map(min => (
            <button
              key={min}
              onClick={() => changePreset(min)}
              disabled={isRunning}
              className={`timer-preset-btn ${selectedMinutes === min ? 'active' : ''}`}
            >
              {min}m
            </button>
          ))}
        </div>
        <button 
          onClick={() => enterZenMode(selectedMinutes)}
          className="timer-preset-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          <span style={{ fontSize: '0.8rem' }}>🎧</span> {t('timer.zenMode')}
        </button>
      </div>

      {/* Main display: arc ring + big digits side by side */}
      <div className="timer-display">
        {/* Compact arc ring */}
        <div className="timer-arc-wrap">
          <svg className="timer-arc-svg" viewBox="0 0 100 100">
            <circle className="timer-arc-track" cx="50" cy="50" r={R} />
            <circle
              className={`timer-arc-fill ${isComplete ? 'timer-arc-fill--done' : ''}`}
              cx="50" cy="50" r={R}
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="timer-arc-label">{stateLabel}</div>
        </div>

        {/* Big digits */}
        <div className="timer-digits-block">
          <div className={digitClass}>
            {mm}
            <span className={`timer-colon ${!isRunning ? 'timer-colon--paused' : ''}`}>:</span>
            {ss}
          </div>
          <div className="timer-session-info">
            {selectedMinutes}min · {isComplete ? t('timer.sessionComplete') : isRunning ? t('timer.focusing') : t('timer.ready')}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="timer-bar-track">
        <div
          className={`timer-bar-fill ${isRunning ? 'timer-bar-fill--running' : ''}`}
          style={{
            width: `${progress * 100}%`,
            backgroundColor: isComplete ? 'var(--accent)' : 'var(--primary)'
          }}
        />
      </div>

      {isComplete && (
        <p className="timer-done-msg">
          {sessionSaved ? t('timer.sessionLogged') : t('timer.sessionCompleteBrief')}
        </p>
      )}

      {/* Controls */}
      <div className="timer-controls">
        <button onClick={reset} className="timer-btn">{t('timer.reset')}</button>
        {isRunning
          ? <button onClick={pause} className="timer-btn timer-btn-pause">{t('timer.pause')}</button>
          : <button onClick={start} className="timer-btn timer-btn-primary">{label}</button>
        }
      </div>

      {/* Breathing Guide CTA after session complete */}
      {isComplete && (
        <button
          onClick={() => setShowBreathing(true)}
          className="timer-btn"
          style={{
            marginTop: '0.5rem',
            width: '100%',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
        >
          🫁 Take a Breath (4-7-8)
        </button>
      )}

      {showBreathing && <BreathingGuide onClose={() => setShowBreathing(false)} />}

    </div>
  )
}

export default FocusTimer
