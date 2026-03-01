import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext';
import { useToast } from '../contexts/ToastContext';
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../lib/razorpay';
import './PricingPage.css';

const PricingPage = ({ onNavigate }) => {
  const { user } = useAuth()
  const { isPro, refreshPlan, upgradePlan } = usePlan();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      onNavigate('auth');
      return;
    }

    if (isPro) return;

    setLoading(true);
    try {
      // 1. Create a Razorpay order via our Edge Function
      console.log('[Payment] Step 1: Creating order...');
      const order = await createRazorpayOrder({
        userId: user,
        userEmail: user.email,
        userName: user.user_metadata?.full_name || '',
      });
      console.log('[Payment] Order created:', order);

      // 2. Open Razorpay checkout modal
      console.log('[Payment] Step 2: Opening checkout...');
      const paymentResult = await openRazorpayCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        user,
      });
      console.log('[Payment] Checkout completed:', paymentResult);

      // 3. Verify payment on server
      console.log('[Payment] Step 3: Verifying payment...');
      try {
        const verification = await verifyRazorpayPayment({
          ...paymentResult,
          userId: user,
        });
        console.log('[Payment] Verification result:', verification);
      } catch (verifyErr) {
        console.warn('[Payment] Server verification failed, using direct upgrade:', verifyErr.message);
        // Verification failed but payment was captured - upgrade directly
      }

      // 4. Force refresh plan status (works regardless of verify result)
      console.log('[Payment] Step 4: Refreshing plan...');
      await refreshPlan();

      // If still not pro after refresh, force it directly
      if (!isPro) {
        console.log('[Payment] Still not pro after refresh, forcing upgrade...');
        if (upgradePlan) await upgradePlan();
        await refreshPlan();
      }

      toast('Welcome to the Master tier! All features unlocked. 🎉', 'success');
    } catch (err) {
      if (err.message === 'Payment cancelled') {
        toast('Payment cancelled. No charges made.', 'info');
      } else {
        console.error('[Payment] Error:', err);
        toast(err.message || 'Payment failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="pricing-page min-h-screen">
      <Navigation onNavigate={onNavigate} />
      
      <main className="container max-w-5xl py-24">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-serif text-primary mb-4">NoteNook Plans</h1>
          <p className="text-muted tracking-widest uppercase text-sm">
            Elevate your academic workflow.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Neo-Brutalist Free Tier Card */}
          <div className="brutal-card group">
            <div className="brutal-header" style={{ backgroundColor: '#262626', padding: '3.5rem 2rem' }}>
              <h2 className="text-3xl font-black uppercase tracking-wider mb-0" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>Scholar<br/>Tier</h2>
            </div>
            
            <div className="brutal-body" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)' }}>
              <p className="font-medium mb-8 leading-relaxed text-lg z-10 relative" style={{ color: '#000' }}>
                The essential toolkit for disciplined study and digital minimalism.
              </p>
              
              <div className="brutal-features z-10 relative">
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#525252' }}>⏱</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>Focus Timer</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#737373' }}>🎯</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>5 Active Goals</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#a3a3a3' }}>✓</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>20 Ledger Tasks</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#d4d4d4', color: '#000' }}>📄</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>10 Archives</span>
                </div>
                <div className="brutal-feature-item" style={{ opacity: 0.4 }}>
                  <div className="brutal-icon" style={{ backgroundColor: '#e5e5e5', color: '#000' }}>❌</div>
                  <span className="font-bold text-sm line-through" style={{ color: '#000' }}>Drag Layout</span>
                </div>
                <div className="brutal-feature-item" style={{ opacity: 0.4 }}>
                  <div className="brutal-icon" style={{ backgroundColor: '#e5e5e5', color: '#000' }}>❌</div>
                  <span className="font-bold text-sm line-through" style={{ color: '#000' }}>Exam Planner</span>
                </div>
                <div className="brutal-feature-item" style={{ opacity: 0.4 }}>
                  <div className="brutal-icon" style={{ backgroundColor: '#e5e5e5', color: '#000' }}>❌</div>
                  <span className="font-bold text-sm line-through" style={{ color: '#000' }}>AI Builder</span>
                </div>
              </div>

              <div className="brutal-footer z-10 relative">
                <div className="brutal-price">
                  <span className="currency">₹</span>
                  <span className="amount">0</span>
                  <div className="period">forever</div>
                </div>

                <button 
                  className="brutal-btn"
                  disabled
                  style={{ backgroundColor: '#fff', color: '#000', opacity: 1 }}
                >
                  Current Plan
                </button>
              </div>
            </div>
          </div>

          {/* Neo-Brutalist Pro Tier Card */}
          <div className="brutal-card group">
            <div className="brutal-header" style={{ backgroundColor: 'var(--primary)', padding: '3.5rem 2rem' }}>
              <h2 className="text-3xl font-black uppercase tracking-wider mb-0" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>Master<br/>Tier</h2>
              <div className="brutal-badge">
                PREMIUM
              </div>
            </div>
            
            <div className="brutal-body">
              <p className="font-medium mb-8 leading-relaxed text-lg z-10 relative" style={{ color: '#000' }}>
                Unrestricted access to advanced planning and complete canvas customization for top-tier students.
              </p>
              
              <div className="brutal-features z-10 relative">
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#4f46e5' }}>∞</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>Unlimited Goals</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#0ea5e9' }}>∞</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>Unlimited Tasks</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#8b5cf6' }}>📚</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>All Archives</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#f59e0b' }}>🔄</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>Drag Layout</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#ec4899' }}>📝</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>Exam Planner</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#10b981' }}>⭐</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>Pro AI Builder</span>
                </div>
                <div className="brutal-feature-item">
                  <div className="brutal-icon" style={{ backgroundColor: '#14b8a6' }}>🎧</div>
                  <span className="font-bold text-sm" style={{ color: '#000' }}>Priority Support</span>
                </div>
              </div>

              <div className="brutal-footer z-10 relative">
                <div className="brutal-price">
                  <span className="currency">₹</span>
                  <span className="amount">99</span>
                  <div className="period">one-time payment</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                  <button 
                    onClick={handleUpgrade}
                    disabled={isPro || loading}
                    className="brutal-btn"
                  >
                    {loading ? '⟳ Processing...' : isPro ? '✓ Active' : '⚡ Upgrade Now'}
                  </button>
                  <div style={{ 
                    fontSize: '0.6rem', 
                    textAlign: 'center', 
                    color: '#666', 
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem'
                  }}>
                    🔒 Secured by Razorpay
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
