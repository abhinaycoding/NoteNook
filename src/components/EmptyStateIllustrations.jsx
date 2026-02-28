import React from 'react'

/**
 * Hand-drawn style SVG illustrations for empty states.
 * Uses currentColor and CSS variables for theme compatibility.
 */

export const EmptyLedger = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
    {/* Notebook body */}
    <rect x="25" y="15" width="70" height="90" rx="2" stroke="var(--text-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
    {/* Notebook spine */}
    <line x1="38" y1="15" x2="38" y2="105" stroke="var(--primary)" strokeWidth="1" opacity="0.5" />
    {/* Ruling lines */}
    <line x1="44" y1="35" x2="85" y2="35" stroke="var(--border)" strokeWidth="0.8" />
    <line x1="44" y1="47" x2="80" y2="47" stroke="var(--border)" strokeWidth="0.8" />
    <line x1="44" y1="59" x2="82" y2="59" stroke="var(--border)" strokeWidth="0.8" />
    <line x1="44" y1="71" x2="75" y2="71" stroke="var(--border)" strokeWidth="0.8" />
    <line x1="44" y1="83" x2="78" y2="83" stroke="var(--border)" strokeWidth="0.8" />
    {/* Pencil */}
    <g transform="translate(65, 55) rotate(35)">
      <rect x="0" y="-3" width="40" height="6" rx="1" stroke="var(--text-secondary)" strokeWidth="1" fill="none" />
      <polygon points="-6,-0 0,-3 0,3" fill="var(--primary)" opacity="0.7" />
      <rect x="34" y="-3" width="6" height="6" rx="0.5" fill="var(--accent)" opacity="0.4" />
    </g>
    {/* Small check marks (empty) */}
    <rect x="44" y="31" width="5" height="5" rx="0.5" stroke="var(--text-secondary)" strokeWidth="0.8" fill="none" opacity="0.4" />
    <rect x="44" y="43" width="5" height="5" rx="0.5" stroke="var(--text-secondary)" strokeWidth="0.8" fill="none" opacity="0.4" />
    <rect x="44" y="55" width="5" height="5" rx="0.5" stroke="var(--text-secondary)" strokeWidth="0.8" fill="none" opacity="0.4" />
  </svg>
)

export const EmptyArchive = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
    {/* Shelf */}
    <line x1="15" y1="100" x2="105" y2="100" stroke="var(--text-primary)" strokeWidth="1.5" />
    <line x1="15" y1="100" x2="15" y2="96" stroke="var(--text-primary)" strokeWidth="1" />
    <line x1="105" y1="100" x2="105" y2="96" stroke="var(--text-primary)" strokeWidth="1" />
    
    {/* Single tilted book */}
    <g transform="translate(50, 45) rotate(-8)">
      <rect x="0" y="0" width="18" height="55" rx="1.5" stroke="var(--primary)" strokeWidth="1.2" fill="none" />
      {/* Spine detail */}
      <line x1="9" y1="8" x2="9" y2="47" stroke="var(--primary)" strokeWidth="0.6" opacity="0.4" />
      {/* Top label */}
      <rect x="4" y="6" width="10" height="3" rx="0.5" fill="var(--primary)" opacity="0.15" />
    </g>
    
    {/* Ghost outlines (where books could be) */}
    <rect x="25" y="52" width="14" height="48" rx="1" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
    <rect x="75" y="42" width="16" height="58" rx="1" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
    <rect x="93" y="55" width="10" height="45" rx="1" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.2" />
    
    {/* Small plus icon */}
    <g transform="translate(82, 68)" opacity="0.3">
      <line x1="0" y1="5" x2="10" y2="5" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="0" x2="5" y2="10" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  </svg>
)
