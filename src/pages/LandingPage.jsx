import React, { useState, useEffect, useRef } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { useTranslation } from '../contexts/LanguageContext'
import { trackEvent } from '../lib/analytics'
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
      {ticks.map((tick, i) => (
        <line
          key={i}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke="var(--text-primary)"
          strokeWidth={tick.major ? 1.5 : 0.5}
          opacity={tick.major ? 0.8 : 0.4}
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 28}
        stroke="var(--text-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        transform={`rotate(${hourDeg}, ${cx}, ${cy})`}
      />
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 40}
        stroke="var(--text-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${minuteDeg}, ${cx}, ${cy})`}
      />
      <line
        x1={cx}
        y1={cy + 8}
        x2={cx}
        y2={cy - 44}
        stroke="var(--primary)"
        strokeWidth="0.8"
        strokeLinecap="round"
        transform={`rotate(${secondDeg}, ${cx}, ${cy})`}
      />
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
        setChecked((prev) => [...prev, idx])
        idx += 1
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
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.5rem 0',
            borderBottom: '1px solid var(--border)',
            opacity: checked.includes(i) ? 0.4 : 0.8,
            transition: 'opacity 0.4s ease',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 2,
              flexShrink: 0,
              border: `1px solid ${checked.includes(i) ? 'var(--accent)' : 'var(--text-primary)'}`,
              background: checked.includes(i) ? 'var(--accent)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              fontSize: '0.55rem',
              color: '#fff',
            }}
          >
            {checked.includes(i) && '\u2713'}
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.03em',
              textDecoration: checked.includes(i) ? 'line-through' : 'none',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.3s ease',
            }}
          >
            {task}
          </span>
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
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px', paddingBottom: '1px' }}>
      {BOOKS.map((book, i) => (
        <div
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: book.w,
            height: book.h,
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
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '15%',
              width: '1px',
              height: '70%',
              background: hovered === i ? 'rgba(255,255,255,0.3)' : book.color,
              opacity: 0.4,
              transition: 'all 0.3s ease',
            }}
          />
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '1px',
          background: 'var(--text-primary)',
          opacity: 0.3,
        }}
      />
    </div>
  )
}

const PROOF_ITEMS = [
  { stat: '500+', label: 'Students' },
  { stat: '10,000+', label: 'Focus Hours Logged' },
  { stat: '50,000+', label: 'Tasks Completed' },
  { stat: '4.9\u2605', label: 'Student Rating' },
  { stat: '98%', label: 'Say It Improved Focus' },
  { stat: '12', label: 'Countries' },
]

const SocialProofStrip = () => (
  <section className="proof-strip">
    <div className="proof-track">
      {[...PROOF_ITEMS, ...PROOF_ITEMS].map((item, i) => (
        <div key={i} className="proof-item">
          <span className="proof-stat">{item.stat}</span>
          <span className="proof-label">{item.label}</span>
          <span className="proof-dot">{'\u00B7'}</span>
        </div>
      ))}
    </div>
  </section>
)

const LandingPage = ({ onNavigate }) => {
  const { t } = useTranslation()
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [scrollY, setScrollY] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const spotlightRef = useRef(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined
    }

    let frameId = null

    const handleMouseMove = (e) => {
      if (frameId) return

      frameId = window.requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        setMousePos({ x, y })

        if (spotlightRef.current) {
          spotlightRef.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, var(--primary), transparent 70%)`
        }
        frameId = null
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined
    }

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prefersReducedMotion])

  const scrollTo = (id) => {
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleHeroPrimaryCta = () => {
    void trackEvent('landing_cta_click', {
      cta_id: 'hero_primary',
      target: 'dashboard',
    })
    onNavigate('dashboard')
  }

  const handleHeroSecondaryCta = () => {
    void trackEvent('landing_cta_click', {
      cta_id: 'hero_secondary',
      target: 'subscribe',
    })
    scrollTo('subscribe')
  }

  const parallaxOffset = prefersReducedMotion ? 0 : Math.min(scrollY * 0.4, 200)
  const parallaxOpacity = prefersReducedMotion ? 1 : Math.max(1 - scrollY / 600, 0)
  const parallaxScale = prefersReducedMotion ? 1 : Math.max(1 - scrollY / 3000, 0.92)
  const tiltX = prefersReducedMotion ? 0 : (mousePos.y - 0.5) * 12
  const tiltY = prefersReducedMotion ? 0 : (mousePos.x - 0.5) * -12
  const moveX = prefersReducedMotion ? 0 : (mousePos.x - 0.5) * 30
  const moveY = prefersReducedMotion ? 0 : (mousePos.y - 0.5) * 20

  return (
    <div className="landing-page">
      <Navigation onNavigate={onNavigate} />

      <main className="editorial-main">
        <section id="manifesto" className="hero-section container mt-20 pt-12">
          <div className="hero-spotlight" ref={spotlightRef} aria-hidden="true" />

          <div className="hero-bg" aria-hidden="true">
            <div style={{ transform: `translate(${moveX * -1.5}px, ${moveY * -1.5}px)`, transition: 'transform 0.4s ease-out' }}>
              <div className="hero-orb hero-orb--1" />
            </div>
            <div style={{ transform: `translate(${moveX * 1.2}px, ${moveY * 1.2}px)`, transition: 'transform 0.5s ease-out' }}>
              <div className="hero-orb hero-orb--2" />
            </div>
            <div style={{ transform: `translate(${moveX * -0.8}px, ${moveY * -0.8}px)`, transition: 'transform 0.6s ease-out' }}>
              <div className="hero-orb hero-orb--3" />
            </div>
            <div className="hero-grid" />
          </div>

          <div className="hero-badge reveal">Daily Focus Engine for Students</div>

          <h1
            className="text-8xl font-serif text-center mt-12 mb-8 hero-3d-text"
            style={{
              transform: `translateY(-${parallaxOffset}px) scale(${parallaxScale}) perspective(1000px) rotateX(${tiltX * 0.5}deg) rotateY(${tiltY * 0.5}deg) translate(${moveX * 0.3}px, ${moveY * 0.2}px)`,
              opacity: parallaxOpacity,
              transition: 'transform 0.2s ease-out, opacity 0.1s linear',
              willChange: 'transform, opacity',
              position: 'relative',
              zIndex: 2,
              textShadow: `${moveX * -0.3}px ${moveY * -0.3}px 20px rgba(var(--primary-rgb, 200, 80, 40), 0.15)`,
            }}
          >
            <span className="title-line-wrapper">
              <span className="title-line">{t('landing.heroTitle1')}</span>
            </span>
            <br />
            <span className="title-line-wrapper">
              <i className="text-primary text-serif-italic title-line title-line-delay-1">{t('landing.heroTitle2')}</i>
            </span>
          </h1>

          <div
            className="flex justify-center mt-12 mb-20 text-center mx-auto"
            style={{
              maxWidth: '48rem',
              transform: `translateY(-${parallaxOffset * 0.6}px) translate(${moveX * 0.15}px, ${moveY * 0.1}px)`,
              opacity: parallaxOpacity,
              willChange: 'transform, opacity',
              position: 'relative',
              zIndex: 2,
              transition: 'transform 0.25s ease-out',
            }}
          >
            <p className="editorial-lead text-lg font-medium cinematic-fade-in">
              {t('landing.heroSubtitle')}
            </p>
          </div>

          <div
            className="hero-cta-wrap reveal reveal-delay-2"
            style={{
              position: 'relative',
              zIndex: 2,
              transform: `translate(${moveX * 0.05}px, ${moveY * 0.05}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <button className="btn-primary" onClick={handleHeroPrimaryCta}>
              {t('landing.heroCta')}
            </button>
            <button className="btn-ghost" onClick={handleHeroSecondaryCta}>
              View Plans
            </button>
          </div>

          <div className="hero-metric-grid reveal reveal-delay-3">
            {PROOF_ITEMS.slice(0, 3).map((item) => (
              <div className="hero-metric-card" key={item.label}>
                <div className="hero-metric-stat">{item.stat}</div>
                <div className="hero-metric-label">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="tools" className="mt-20">
          <div className="container">
            <div className="pt-20 border-t border-ink">
              <div className="flex justify-between items-end mb-12 reveal">
                <h2 className="text-6xl font-serif">{t('landing.instrumentsTitle')}</h2>
                <p className="text-sm uppercase tracking-widest max-w-xs text-right hidden-mobile">
                  {t('landing.instrumentsSubtitle')}
                </p>
              </div>

              <div className="editorial-grid">
                <div className="ed-card border-r border-ink pr-8 flex-col justify-between reveal reveal-delay-1">
                  <div>
                    <div className="ed-numero font-serif text-4xl mb-4 text-accent">{t('landing.feature1Number')}</div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{t('landing.feature1Title')}</h3>
                    <p className="text-base text-muted">{t('landing.feature1Desc')}</p>
                  </div>
                  <div className="ed-sketch mt-8">
                    <SketchLedger />
                  </div>
                </div>

                <div className="ed-card border-r border-ink px-8 flex-col justify-between reveal reveal-delay-2">
                  <div>
                    <div className="ed-numero font-serif text-4xl mb-4 text-primary">{t('landing.feature2Number')}</div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{t('landing.feature2Title')}</h3>
                    <p className="text-base text-muted">{t('landing.feature2Desc')}</p>
                  </div>
                  <div className="ed-sketch flex justify-center mt-8">
                    <LiveClock />
                  </div>
                </div>

                <div className="ed-card pl-8 flex-col justify-between reveal reveal-delay-3">
                  <div>
                    <div className="ed-numero font-serif text-4xl mb-4 text-accent">{t('landing.feature3Number')}</div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{t('landing.feature3Title')}</h3>
                    <p className="text-base text-muted">{t('landing.feature3Desc')}</p>
                  </div>
                  <div className="ed-sketch mt-8">
                    <SketchBookshelf />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SocialProofStrip />

        <section id="subscribe" className="mt-20">
          <div className="container">
            <div className="py-20 border-y border-ink">
              <div className="lp-pricing-header">
                <h2 className="text-6xl font-serif">{t('landing.pricingTitle')}</h2>
                <p className="text-sm uppercase tracking-widest text-muted max-w-xs text-right hidden-mobile">
                  {t('landing.pricingSubtitle')}
                </p>
              </div>

              <div className="lp-pricing-grid">
                <div className="lp-price-card">
                  <div className="lp-price-top">
                    <div className="lp-price-ed-no font-serif text-accent">{t('landing.freeEdNumber')}</div>
                    <div className="lp-price-tier">{t('landing.freeTier')}</div>
                    <div className="lp-price-amount font-serif">{t('landing.freePrice')}<span className="lp-price-period">{t('landing.freePeriod')}</span></div>
                  </div>
                  <ul className="lp-feature-list">
                    <li>{t('landing.freeFeature1')}</li>
                    <li>{t('landing.freeFeature2')}</li>
                    <li>{t('landing.freeFeature3')}</li>
                    <li>{t('landing.freeFeature4')}</li>
                    <li>{t('landing.freeFeature5')}</li>
                    <li>{t('landing.freeFeature6')}</li>
                    <li className="lp-feature-locked">{t('landing.freeFeature7')}</li>
                    <li className="lp-feature-locked">{t('landing.freeFeature8')}</li>
                    <li className="lp-feature-locked">{t('landing.freeFeature9')}</li>
                  </ul>
                  <button
                    className="lp-price-btn lp-price-btn--free"
                    onClick={() => {
                      void trackEvent('landing_cta_click', { cta_id: 'pricing_free', target: 'dashboard' })
                      onNavigate('dashboard')
                    }}
                  >
                    {t('landing.freeCta')}
                  </button>
                </div>

                <div className="lp-price-divider" />

                <div className="lp-price-card lp-price-card--pro">
                  <div className="lp-popular-tag">{t('landing.proTag')}</div>
                  <div className="lp-price-top">
                    <div className="lp-price-ed-no font-serif" style={{ color: 'var(--primary)' }}>{t('landing.proEdNumber')}</div>
                    <div className="lp-price-tier">{t('landing.proTier')}</div>
                    <div className="lp-price-amount font-serif">{t('landing.proPrice')}<span className="lp-price-period">{t('landing.proPeriod')}</span></div>
                  </div>
                  <ul className="lp-feature-list">
                    <li>{t('landing.proFeature1')}</li>
                    <li className="lp-feature-pro">{t('landing.proFeature2')}</li>
                    <li className="lp-feature-pro">{t('landing.proFeature3')}</li>
                    <li className="lp-feature-pro">{t('landing.proFeature4')}</li>
                    <li className="lp-feature-pro">{t('landing.proFeature5')}</li>
                    <li className="lp-feature-pro">{t('landing.proFeature6')}</li>
                    <li className="lp-feature-pro">{t('landing.proFeature7')}</li>
                  </ul>
                  <button
                    className="lp-price-btn lp-price-btn--pro"
                    onClick={() => {
                      void trackEvent('landing_cta_click', { cta_id: 'pricing_pro', target: 'dashboard' })
                      onNavigate('dashboard')
                    }}
                  >
                    {t('landing.proCta')}
                  </button>
                  <div className="lp-price-note">{t('landing.proPayNote')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
