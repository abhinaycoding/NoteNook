import React, { useState, useEffect } from 'react'
import './BreathingGuide.css'

const PHASES = [
  { label: 'Breathe In', duration: 4000 },
  { label: 'Hold', duration: 7000 },
  { label: 'Breathe Out', duration: 8000 },
]

const BreathingGuide = ({ onClose }) => {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [cycles, setCycles] = useState(0)

  const phase = PHASES[phaseIndex]

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIndex = (phaseIndex + 1) % PHASES.length
      setPhaseIndex(nextIndex)
      if (nextIndex === 0) setCycles(c => c + 1)
    }, phase.duration)

    return () => clearTimeout(timer)
  }, [phaseIndex, phase.duration])

  const scaleClass = phaseIndex === 0 ? 'breathing-expand' : phaseIndex === 1 ? 'breathing-hold' : 'breathing-shrink'

  return (
    <div className="breathing-overlay" onClick={onClose}>
      <div className="breathing-container" onClick={e => e.stopPropagation()}>
        <div className={`breathing-circle ${scaleClass}`}>
          <div className="breathing-inner-circle" />
        </div>
        <div className="breathing-label">{phase.label}</div>
        <div className="breathing-cycles">{cycles} cycle{cycles !== 1 ? 's' : ''} completed</div>
        <button className="breathing-close" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}

export default BreathingGuide
