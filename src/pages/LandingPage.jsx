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

          {/* Subscribe / Pricing block */}
          <section id="subscribe" className="mt-20">
            <div className="container">
              <div className="py-20 border-y border-ink">
                <div className="flex-col items-center text-center max-w-3xl mx-auto">
                  <h2 className="text-4xl font-serif mb-6">Gain Access.</h2>
                  <p className="text-lg text-muted mb-12">
                    A single subscription for all instruments. No intricate tiers.
                  </p>

                  <div className="pricing-ticket">
                    <div className="ticket-edge ticket-left"></div>
                    
                    <div className="ticket-body">
                      <h3 className="uppercase tracking-widest text-sm mb-4">The Scholar Pass</h3>
                      <div className="text-6xl font-serif font-bold mb-8">$4 <span className="text-xl">USD</span></div>
                      <button className="btn-secondary w-full" onClick={() => onNavigate('auth')}>Procure Pass</button>
                    </div>
                    
                    <div className="ticket-edge ticket-right"></div>
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
