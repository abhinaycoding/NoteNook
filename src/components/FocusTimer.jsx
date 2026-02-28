import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useZen } from '../contexts/ZenContext'
import { useTimer } from '../contexts/TimerContext'
import Confetti from './Confetti'
import './FocusTimer.css'

const FocusTimer = () => {
  const { user } = useAuth()
  const toast = useToast()
  const { enterZenMode } = useZen()
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
  const label = isComplete ? 'Restart' : (secondsLeft < selectedMinutes * 60 && !isRunning) ? 'Resume' : 'Commence'
  const stateLabel = isComplete ? 'Done' : isRunning ? 'ON' : '—'

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
          <span style={{ fontSize: '0.8rem' }}>🎧</span> Zen Mode
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
            {selectedMinutes}min · {isComplete ? 'Session complete' : isRunning ? 'Focusing…' : 'Ready to begin'}
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
          {sessionSaved ? '✓ Session logged to Analytics.' : 'Session complete!'}
        </p>
      )}

      {/* Controls */}
      <div className="timer-controls">
        <button onClick={reset} className="timer-btn">Reset</button>
        {isRunning
          ? <button onClick={pause} className="timer-btn timer-btn-pause">Pause</button>
          : <button onClick={start} className="timer-btn timer-btn-primary">{label}</button>
        }
      </div>

    </div>
  )
}

export default FocusTimer
