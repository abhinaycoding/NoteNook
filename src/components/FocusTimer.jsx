import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import './FocusTimer.css'

const PRESETS = [25, 45, 60]

// ── Module-level timer state (survives page navigation) ──
let _selected = 25
let _left = 25 * 60
let _running = false
let _done = false
let _saved = false
let _timerId = null
let _subs = []
const notify = () => _subs.forEach(fn => fn())

const timerStart = () => {
  if (_done) { _left = _selected * 60; _done = false; _saved = false }
  if (_running) return
  _running = true
  clearInterval(_timerId)
  _timerId = setInterval(() => {
    if (_left <= 1) {
      clearInterval(_timerId)
      _left = 0; _running = false; _done = true
    } else {
      _left -= 1
    }
    notify()
  }, 1000)
  notify()
}

const timerPause = () => {
  clearInterval(_timerId)
  _running = false
  notify()
}

const timerReset = () => {
  clearInterval(_timerId)
  _running = false; _done = false; _saved = false
  _left = _selected * 60
  notify()
}

const timerPreset = (min) => {
  if (_running) return
  clearInterval(_timerId)
  _selected = min; _left = min * 60
  _running = false; _done = false; _saved = false
  notify()
}

const FocusTimer = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [, tick] = useState(0)

  useEffect(() => {
    const fn = () => tick(n => n + 1)
    _subs.push(fn)
    return () => { _subs = _subs.filter(s => s !== fn) }
  }, [])

  useEffect(() => {
    if (_done && user && !_saved) {
      _saved = true
      supabase.from('sessions').insert([{
        user_id: user.id,
        duration_seconds: _selected * 60,
        completed: true,
        created_at: new Date().toISOString(),
      }]).then(({ error }) => {
        if (!error) toast(`${_selected}m session logged. Well done, Scholar.`, 'success', 4000)
      }).catch(e => console.error(e.message))
    }
  })

  const mm = Math.floor(_left / 60).toString().padStart(2, '0')
  const ss = (_left % 60).toString().padStart(2, '0')
  const progress = (_selected * 60 - _left) / (_selected * 60)
  const label = _done ? 'Restart' : (_left < _selected * 60 && !_running) ? 'Resume' : 'Commence'
  const stateLabel = _done ? 'Done' : _running ? 'ON' : '—'

  // SVG arc
  const R = 44
  const CIRC = 2 * Math.PI * R
  const offset = CIRC * (1 - progress)

  const digitClass = [
    'timer-digits',
    _running ? 'timer-digits--running' : '',
    _done ? 'timer-digits--done' : '',
  ].join(' ')

  return (
    <div className="timer-widget">

      {/* Preset chips */}
      <div className="timer-presets">
        {PRESETS.map(min => (
          <button
            key={min}
            onClick={() => timerPreset(min)}
            disabled={_running}
            className={`timer-preset-btn ${_selected === min ? 'active' : ''}`}
          >
            {min}m
          </button>
        ))}
      </div>

      {/* Main display: arc ring + big digits side by side */}
      <div className="timer-display">
        {/* Compact arc ring */}
        <div className="timer-arc-wrap">
          <svg className="timer-arc-svg" viewBox="0 0 100 100">
            <circle className="timer-arc-track" cx="50" cy="50" r={R} />
            <circle
              className={`timer-arc-fill ${_done ? 'timer-arc-fill--done' : ''}`}
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
            <span className={`timer-colon ${!_running ? 'timer-colon--paused' : ''}`}>:</span>
            {ss}
          </div>
          <div className="timer-session-info">
            {_selected}min · {_done ? 'Session complete' : _running ? 'Focusing…' : 'Ready to begin'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="timer-bar-track">
        <div
          className={`timer-bar-fill ${_running ? 'timer-bar-fill--running' : ''}`}
          style={{
            width: `${progress * 100}%`,
            backgroundColor: _done ? 'var(--accent)' : 'var(--primary)'
          }}
        />
      </div>

      {_done && (
        <p className="timer-done-msg">
          {_saved ? '✓ Session logged to Analytics.' : 'Session complete!'}
        </p>
      )}

      {/* Controls */}
      <div className="timer-controls">
        <button onClick={timerReset} className="timer-btn">Reset</button>
        {_running
          ? <button onClick={timerPause} className="timer-btn timer-btn-pause">Pause</button>
          : <button onClick={timerStart} className="timer-btn timer-btn-primary">{label}</button>
        }
      </div>

    </div>
  )
}

export default FocusTimer
