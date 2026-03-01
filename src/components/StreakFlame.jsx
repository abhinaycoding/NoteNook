import React from 'react'
import './StreakFlame.css'

const StreakFlame = ({ streak = 0 }) => {
  if (streak <= 0) return null

  // Flame intensity based on streak
  const intensity = streak >= 30 ? 'legendary' : streak >= 14 ? 'blazing' : streak >= 7 ? 'strong' : streak >= 3 ? 'warm' : 'ember'
  const flameScale = Math.min(1 + (streak * 0.03), 1.8)

  return (
    <div className={`streak-flame streak-flame--${intensity}`} title={`${streak} day streak!`}>
      <svg
        viewBox="0 0 36 48"
        className="streak-flame-svg"
        style={{ transform: `scale(${flameScale})` }}
      >
        {/* Outer flame */}
        <path
          className="flame-outer"
          d="M18 2C18 2 5 18 5 30C5 38 11 44 18 46C25 44 31 38 31 30C31 18 18 2 18 2Z"
          fill="url(#flameGradient)"
        />
        {/* Inner flame */}
        <path
          className="flame-inner"
          d="M18 14C18 14 11 24 11 32C11 37 14 40 18 42C22 40 25 37 25 32C25 24 18 14 18 14Z"
          fill="url(#flameInner)"
        />
        {/* Core */}
        <ellipse
          className="flame-core"
          cx="18" cy="36" rx="4" ry="6"
          fill="url(#flameCore)"
        />
        <defs>
          <linearGradient id="flameGradient" x1="18" y1="2" x2="18" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff4500" />
            <stop offset="50%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#ffaa33" />
          </linearGradient>
          <linearGradient id="flameInner" x1="18" y1="14" x2="18" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffcc02" />
            <stop offset="100%" stopColor="#ff8800" />
          </linearGradient>
          <radialGradient id="flameCore" cx="50%" cy="60%">
            <stop offset="0%" stopColor="#fff8e1" />
            <stop offset="100%" stopColor="#ffcc02" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <span className="streak-count">{streak}</span>
      {/* Particle sparks */}
      <div className="spark spark-1" />
      <div className="spark spark-2" />
      <div className="spark spark-3" />
    </div>
  )
}

export default StreakFlame
