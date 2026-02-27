import React, { useState, useEffect, useRef } from 'react'
import Navigation from '../components/Navigation'
import './LandingPage.css'

const LiveClock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const seconds = time.getSeconds()
  const minutes = time.getMinutes()
  const hours = time.getHours() % 12

  const secondDeg = seconds * 6
  const minuteDeg = minutes * 6 + seconds * 0.1
  const hourDeg = hours * 30 + minutes * 0.5

  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 52

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180)
    const innerR = i % 3 === 0 ? r - 10 : r - 6
    return {
      x1: cx + innerR * Math.cos(angle),
      y1: cy + innerR * Math.sin(angle),
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
      major: i % 3 === 0,
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--text-primary)" strokeWidth="1" />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="var(--text-primary)" strokeWidth={t.major ? 1.5 : 0.5} opacity={t.major ? 0.8 : 0.4} />
      ))}
      <line x1={cx} y1={cy} x2={cx} y2={cy - 28}
        stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round"
        transform={`rotate(${hourDeg}, ${cx}, ${cy})`} />
      <line x1={cx} y1={cy} x2={cx} y2={cy - 40}
        stroke="var(--text-primary)" strokeWidth="1.5" strokeLinecap="round"
        transform={`rotate(${minuteDeg}, ${cx}, ${cy})`} />
      <line x1={cx} y1={cy + 8} x2={cx} y2={cy - 44}
        stroke="var(--primary)" strokeWidth="0.8" strokeLinecap="round"
        transform={`rotate(${secondDeg}, ${cx}, ${cy})`} />
      <circle cx={cx} cy={cy} r="2.5" fill="var(--primary)" />
    </svg>
  )
}

const LEDGER_TASKS = ['Read Chapter 7', 'Solve Problem Set', 'Review Notes', 'Practice Quiz', 'Write Summary']

const SketchLedger = () => {
  const [checked, setChecked] = useState([])

  useEffect(() => {
    let idx = 0
    const timer = setInterval(() => {
      if (idx < LEDGER_TASKS.length) {
        setChecked(prev => [...prev, idx])
        idx++
      } else {
        idx = 0
        setChecked([])
      }
    }, 1200)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0' }}>
      {LEDGER_TASKS.map((task, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.5rem 0', borderBottom: '1px solid var(--border)',
          opacity: checked.includes(i) ? 0.4 : 0.8,
          transition: 'opacity 0.4s ease'
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: 2, flexShrink: 0,
            border: `1px solid ${checked.includes(i) ? 'var(--accent)' : 'var(--text-primary)'}`,
            background: checked.includes(i) ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease', fontSize: '0.55rem', color: '#fff'
          }}>
            {checked.includes(i) && '✓'}
          </div>
          <span style={{
            fontSize: '0.72rem', letterSpacing: '0.03em',
            textDecoration: checked.includes(i) ? 'line-through' : 'none',
            color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
            transition: 'all 0.3s ease'
          }}>{task}</span>
        </div>
      ))}
    </div>
  )
}

const BOOKS = [
  { h: 95, w: 22, color: 'var(--accent)' },
  { h: 120, w: 28, color: 'var(--primary)' },
  { h: 80, w: 20, color: 'var(--text-secondary)' },
  { h: 110, w: 26, color: 'var(--accent)' },
  { h: 70, w: 18, color: 'var(--border)' },
  { h: 100, w: 24, color: 'var(--primary)' },
  { h: 85, w: 20, color: 'var(--text-secondary)' },
]

const SketchBookshelf = () => {
  const [hovered, setHovered] = useState(null)

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'flex-end', gap: '4px', paddingBottom: '1px'
    }}>
      {BOOKS.map((book, i) => (
        <div
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: book.w, height: book.h,
            border: `1px solid ${book.color}`,
            borderBottom: 'none',
            borderRadius: '2px 2px 0 0',
            position: 'relative',
            background: hovered === i ? book.color : 'transparent',
            opacity: hovered === i ? 0.9 : 0.6,
            transform: hovered === i ? 'translateY(-8px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            cursor: 'pointer',
          }}
        >
          {/* Spine line */}
          <div style={{
            position: 'absolute', left: '50%', top: '15%',
            width: '1px', height: '70%',
            background: hovered === i ? 'rgba(255,255,255,0.3)' : book.color,
            opacity: 0.4, transition: 'all 0.3s ease'
          }} />
        </div>
      ))}
      {/* Shelf line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: '100%', height: '1px',
        background: 'var(--text-primary)', opacity: 0.3
      }} />
    </div>
  )
}

const LandingPage = ({ onNavigate }) => {

  // Scroll reveal: observe .reveal elements
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } })
    }, { threshold: 0.15 })
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Parallax scroll
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const parallaxOffset = Math.min(scrollY * 0.4, 200)
  const parallaxOpacity = Math.max(1 - scrollY / 600, 0)
  const parallaxScale = Math.max(1 - scrollY / 3000, 0.92)
  return (
    <>
      <div className="landing-page">
        <Navigation onNavigate={onNavigate} />
        
        <main className="editorial-main">
          {/* Header Volume I */}
          <section id="manifesto" className="container mt-20 pt-12" ref={heroRef}>
            <h1
              className="text-8xl font-serif text-center mt-12 mb-8 reveal"
              style={{
                transform: `translateY(-${parallaxOffset}px) scale(${parallaxScale})`,
                opacity: parallaxOpacity,
                transition: 'opacity 0.1s linear',
                willChange: 'transform, opacity',
              }}
            >
              The Art of <br/> <i className="text-primary text-serif-italic">Focus</i>.
            </h1>
            
            <div
              className="flex justify-center mt-12 mb-20 text-center mx-auto"
              style={{
                maxWidth: '48rem',
                transform: `translateY(-${parallaxOffset * 0.6}px)`,
                opacity: parallaxOpacity,
                willChange: 'transform, opacity',
              }}
            >
              <p className="editorial-lead text-lg font-medium">
                We have traded scattered digital boards for an elegant, distraction-free ledger. 
                A curated canvas for the modern student. Reclaim your attention. 
              </p>
            </div>
            
            <div className="flex justify-center mt-8 reveal reveal-delay-2">
              <button 
                className="btn-primary" 
                onClick={() => onNavigate('auth')}
              >
                Enter the Canvas
              </button>
            </div>
          </section>

          {/* Magazine Image Grid / Features */}
          <section id="tools" className="mt-20">
            <div className="container">
              <div className="pt-20 border-t border-ink">
                <div className="flex justify-between items-end mb-12 reveal">
                  <h2 className="text-6xl font-serif">The Instruments.</h2>
                  <p className="text-sm uppercase tracking-widest max-w-xs text-right hidden-mobile">
                    Every tool crafted with absolute purpose. No surplus features.
                  </p>
                </div>

                <div className="editorial-grid">
                  {/* Feature 1 */}
                  <div className="ed-card border-r border-ink pr-8 flex-col justify-between reveal reveal-delay-1">
                    <div>
                      <div className="ed-numero font-serif text-4xl mb-4 text-accent">01.</div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">The Ledger</h3>
                      <p className="text-base text-muted">
                        A high-contrast, typographic approach to task planning. Discard overwhelming boards for a linear timeline of your day.
                      </p>
                    </div>
                    <div className="ed-sketch mt-8">
                      <SketchLedger />
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="ed-card border-r border-ink px-8 flex-col justify-between reveal reveal-delay-2">
                    <div>
                      <div className="ed-numero font-serif text-4xl mb-4 text-primary">02.</div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">Chronos</h3>
                      <p className="text-base text-muted">
                        An analog-inspired focus engine. Time is measured in elegant arcs, urging you into states of flow for exactly twenty-five minutes.
                      </p>
                    </div>
                    <div className="ed-sketch flex justify-center mt-8">
                      <LiveClock />
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="ed-card pl-8 flex-col justify-between reveal reveal-delay-3">
                    <div>
                      <div className="ed-numero font-serif text-4xl mb-4 text-accent">03.</div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">The Archive</h3>
                      <p className="text-base text-muted">
                        Your notes, stacked bound beautifully in an interactive bookshelf format. Fast contextual switching.
                      </p>
                    </div>
                    <div className="ed-sketch mt-8">
                      <SketchBookshelf />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing section */}
          <section id="subscribe" className="mt-20">
            <div className="container">
              <div className="py-20 border-y border-ink">

                <div className="lp-pricing-header">
                  <h2 className="text-6xl font-serif">Gain Access.</h2>
                  <p className="text-sm uppercase tracking-widest text-muted max-w-xs text-right hidden-mobile">
                    Every instrument. One canvas. One decision.
                  </p>
                </div>

                <div className="lp-pricing-grid">

                  {/* Free */}
                  <div className="lp-price-card">
                    <div className="lp-price-top">
                      <div className="lp-price-ed-no font-serif text-accent">01.</div>
                      <div className="lp-price-tier">The Canvas — Free</div>
                      <div className="lp-price-amount font-serif">₹0<span className="lp-price-period"> / forever</span></div>
                    </div>
                    <ul className="lp-feature-list">
                      <li>✓ Focus Timer — 25, 45, 60 min</li>
                      <li>✓ The Ledger — up to 20 tasks</li>
                      <li>✓ The Library — up to 10 notes</li>
                      <li>✓ Goals tracker — up to 5 goals</li>
                      <li>✓ Analytics — 7-day chart</li>
                      <li>✓ Achievement badges</li>
                      <li className="lp-feature-locked">✕ Exam Planner</li>
                      <li className="lp-feature-locked">✕ Resume Builder</li>
                      <li className="lp-feature-locked">✕ Custom Dashboard Layout</li>
                    </ul>
                    <button className="lp-price-btn lp-price-btn--free" onClick={() => onNavigate('auth')}>
                      Begin Free
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="lp-price-divider" />

                  {/* Pro */}
                  <div className="lp-price-card lp-price-card--pro">
                    <div className="lp-popular-tag">Scholar's Choice</div>
                    <div className="lp-price-top">
                      <div className="lp-price-ed-no font-serif" style={{ color: 'var(--primary)' }}>02.</div>
                      <div className="lp-price-tier">The Scholar Pass — Pro</div>
                      <div className="lp-price-amount font-serif">₹99<span className="lp-price-period"> / month</span></div>
                    </div>
                    <ul className="lp-feature-list">
                      <li>✓ Everything in Free</li>
                      <li className="lp-feature-pro">✓ Exam Planner + Countdown</li>
                      <li className="lp-feature-pro">✓ Resume Builder + PDF Export</li>
                      <li className="lp-feature-pro">✓ Unlimited Tasks, Notes & Goals</li>
                      <li className="lp-feature-pro">✓ Custom Dashboard Layout</li>
                      <li className="lp-feature-pro">✓ Full Analytics + Streaks</li>
                      <li className="lp-feature-pro">✓ Priority support</li>
                    </ul>
                    <button className="lp-price-btn lp-price-btn--pro" onClick={() => onNavigate('auth')}>
                      Procure the Pass →
                    </button>
                    <div className="lp-price-note">UPI · Cards · Net Banking via Razorpay</div>
                  </div>

                </div>

              </div>
            </div>
          </section>


        </main>

        <footer className="container py-8 flex justify-between uppercase tracking-widest text-xs font-bold border-t border-ink mt-20">
          <div>NoteNook Publishing © 2026</div>
          <div>All Rights Reserved</div>
        </footer>
      </div>
    </>
  )
}

export default LandingPage
