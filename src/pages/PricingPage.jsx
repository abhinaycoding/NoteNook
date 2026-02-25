import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../contexts/PlanContext';
import { useToast } from '../contexts/ToastContext';
import './PricingPage.css';

const PricingPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { isPro, upgradePlan } = usePlan();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      onNavigate('auth');
      return;
    }
    
    setLoading(true);
    try {
      await upgradePlan();
      toast('Welcome to the Pro tier. All features unlocked.', 'success');
    } catch (error) {
      toast('Failed to process upgrade.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page min-h-screen">
      <Navigation onNavigate={onNavigate} />
      
      <main className="container max-w-5xl py-24">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-serif text-primary mb-4">FocusFlow Plans</h1>
          <p className="text-muted tracking-widest uppercase text-sm">
            Elevate your academic workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier Card */}
          <div className="pricing-card free-tier">
            <h2 className="text-2xl font-serif mb-2">Scholar</h2>
            <div className="text-4xl font-serif mb-6">₹0 <span className="text-sm text-muted">/ forever</span></div>
            <p className="text-sm text-muted mb-8 leading-relaxed h-12">
              The essential toolkit for disciplined study and digital minimalism.
            </p>
            
            <ul className="feature-list mb-8">
              <li>✓ Basic Focus Timer</li>
              <li>✓ Up to 5 Active Goals</li>
              <li>✓ Up to 20 Ledger Tasks</li>
              <li>✓ Up to 10 Archive Manuscripts</li>
              <li className="text-muted/50">× Fixed Dashboard Layout</li>
              <li className="text-muted/50">× Exam Journey Planner</li>
              <li className="text-muted/50">× Resume AI Builder</li>
            </ul>

            <button 
              className="btn-outline w-full py-3"
              disabled
            >
              Current Plan
            </button>
          </div>

          {/* Pro Tier Card */}
          <div className="pricing-card pro-tier group">
            <div className="pro-badge">RECOMMENDED</div>
            <h2 className="text-2xl font-serif mb-2 text-primary">Master</h2>
            <div className="text-4xl font-serif mb-6 text-primary">₹199 <span className="text-sm text-ink/70">/ month</span></div>
            <p className="text-sm text-ink/80 mb-8 leading-relaxed h-12">
              Unrestricted access to advanced planning and complete canvas customization.
            </p>
            
            <ul className="feature-list mb-8">
              <li>✓ Unlimited Goals</li>
              <li>✓ Unlimited Ledger Tasks</li>
              <li>✓ Unlimited Archive Manuscripts</li>
              <li><strong>✓ Drag & Drop Dashboard Layout</strong></li>
              <li><strong>✓ Full Exam Journey Planner</strong></li>
              <li><strong>✓ Pro Resume AI Builder</strong></li>
              <li>✓ Priority Support</li>
            </ul>

            <button 
              onClick={handleUpgrade}
              disabled={isPro || loading}
              className={`w-full py-4 uppercase tracking-widest text-sm font-bold transition-all ${
                isPro 
                  ? 'bg-primary/20 text-primary cursor-default' 
                  : 'bg-primary text-cream hover:bg-ink'
              }`}
            >
              {loading ? 'Processing...' : isPro ? 'Active Subscription' : 'Upgrade to Master'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
