import React from 'react'
import './Skeleton.css'

/**
 * Reusable skeleton placeholder for loading states.
 * Usage:
 *   <Skeleton width="100px" height="16px" />
 *   <Skeleton variant="circle" size="40px" />
 *   <Skeleton variant="card" />
 */
const Skeleton = ({ variant = 'text', width, height, size, style = {}, className = '' }) => {
  const baseClass = `skeleton skeleton--${variant} ${className}`

  const computedStyle = {
    ...style,
    ...(width && { width }),
    ...(height && { height }),
    ...(size && variant === 'circle' && { width: size, height: size }),
  }

  return <div className={baseClass} style={computedStyle} />
}

/**
 * Pre-built skeleton patterns for common widgets
 */
export const SkeletonCard = () => (
  <div className="skeleton-card">
    <Skeleton height="12px" width="40%" />
    <Skeleton height="28px" width="60%" />
    <Skeleton height="10px" width="80%" />
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
      <Skeleton variant="circle" size="24px" />
      <Skeleton height="12px" width="120px" />
    </div>
  </div>
)

export const SkeletonTimer = () => (
  <div className="skeleton-card" style={{ textAlign: 'center' }}>
    <Skeleton height="10px" width="60%" style={{ margin: '0 auto' }} />
    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', margin: '0.75rem 0' }}>
      <Skeleton height="48px" width="48px" style={{ borderRadius: '8px' }} />
      <Skeleton height="48px" width="12px" style={{ borderRadius: '4px' }} />
      <Skeleton height="48px" width="48px" style={{ borderRadius: '8px' }} />
    </div>
    <Skeleton height="6px" width="100%" />
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
      <Skeleton height="32px" width="50%" style={{ borderRadius: '6px' }} />
      <Skeleton height="32px" width="50%" style={{ borderRadius: '6px' }} />
    </div>
  </div>
)

export const SkeletonList = ({ rows = 3 }) => (
  <div className="skeleton-card">
    <Skeleton height="10px" width="30%" />
    {[...Array(rows)].map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
        <Skeleton variant="circle" size="20px" />
        <Skeleton height="14px" width={`${60 + Math.random() * 30}%`} />
      </div>
    ))}
  </div>
)

export default Skeleton
