import React from 'react'
import Navigation from '../components/Navigation'
import './LandingPage.css'

const LandingPage = ({ onNavigate }) => {

  return (
    <>
      <div className="landing-page">
        <Navigation onNavigate={onNavigate} />
        
        <main className="editorial-main">
          {/* Header Volume I */}
          <section id="manifesto" className="container mt-20 pt-12">
            <h1 className="text-8xl font-serif text-center mt-12 mb-8">
              The Art of <br/> <i className="text-primary text-serif-italic">Focus</i>.
            </h1>
            
            <div className="flex justify-center mt-12 mb-20 text-center mx-auto" style={{maxWidth: '48rem'}}>
              <p className="editorial-lead text-lg font-medium">
                We have traded scattered digital boards for an elegant, distraction-free ledger. 
                A curated canvas for the modern student. Reclaim your attention. 
              </p>
            </div>
            
            <div className="flex justify-center mt-8">
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
                <div className="flex justify-between items-end mb-12">
                  <h2 className="text-6xl font-serif">The Instruments.</h2>
                  <p className="text-sm uppercase tracking-widest max-w-xs text-right hidden-mobile">
                    Every tool crafted with absolute purpose. No surplus features.
                  </p>
                </div>

                <div className="editorial-grid">
                  {/* Feature 1 */}
                  <div className="ed-card border-r border-ink pr-8 flex-col justify-between">
                    <div>
                      <div className="ed-numero font-serif text-4xl mb-4 text-accent">01.</div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">The Ledger</h3>
                      <p className="text-base text-muted">
                        A high-contrast, typographic approach to task planning. Discard overwhelming boards for a linear timeline of your day.
                      </p>
                    </div>
                    <div className="ed-sketch mt-8">
                      {/* CSS sketched art */}
                      <div className="sketch-lines"></div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="ed-card border-r border-ink px-8 flex-col justify-between">
                    <div>
                      <div className="ed-numero font-serif text-4xl mb-4 text-primary">02.</div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">Chronos</h3>
                      <p className="text-base text-muted">
                        An analog-inspired focus engine. Time is measured in elegant arcs, urging you into states of flow for exactly twenty-five minutes.
                      </p>
                    </div>
                    <div className="ed-sketch flex justify-center mt-8">
                      <div className="sketch-clock"></div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="ed-card pl-8 flex-col justify-between">
                    <div>
                      <div className="ed-numero font-serif text-4xl mb-4 text-accent">03.</div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">The Archive</h3>
                      <p className="text-base text-muted">
                        Your notes, stacked bound beautifully in an interactive bookshelf format. Fast contextual switching.
                      </p>
                    </div>
                    <div className="ed-sketch mt-8">
                      <div className="sketch-books"></div>
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
          <div>FocusFlow Publishing © 2026</div>
          <div>All Rights Reserved</div>
        </footer>
      </div>
    </>
  )
}

export default LandingPage
