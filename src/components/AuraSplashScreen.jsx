import React from 'react'
import './AuraSplashScreen.css'

const AuraSplashScreen = () => {
  const BRAND_NAME = "FOCUSFLOW"
  const nodes = [
    { size: 300, top: '10%', left: '10%', delay: '0s' },
    { size: 250, top: '60%', left: '80%', delay: '1s' },
    { size: 200, top: '80%', left: '20%', delay: '2s' },
    { size: 150, top: '20%', left: '70%', delay: '3.5s' }
  ]

  return (
    <div className="aura-splash-overlay">
      {/* Texture Overlay */}
      <div className="aura-grain-overlay" />
      
      {/* Neural Glow Background */}
      <div className="aura-neural-glow" />

      {/* Floating Soft Nodes */}
      {nodes.map((node, i) => (
        <div 
          key={i}
          className="aura-node-particle"
          style={{
            width: `${node.size}px`,
            height: `${node.size}px`,
            top: node.top,
            left: node.left,
            animation: `glow-float ${6 + i}s ease-in-out infinite alternate`,
            animationDelay: node.delay
          }}
        />
      ))}

      {/* Glass Hub & Logo */}
      <div className="aura-hub">
        <div className="aura-logo-text">NN.</div>
      </div>

      {/* Kinetic Typography Brand Reveal */}
      <div className="aura-brand-container">
        {BRAND_NAME.split('').map((char, i) => (
          <span 
            key={i} 
            className="aura-brand-letter"
            style={{ animationDelay: `${0.6 + i * 0.08}s` }}
          >
            {char}
          </span>
        ))}
      </div>

      <div className="aura-loader-bar">
        <div className="aura-loader-fill" />
      </div>

      <div className="aura-neural-status">
        <span className="aura-pulse-text">Initiating Neural Uplink...</span>
      </div>
    </div>
  )
}

export default AuraSplashScreen
