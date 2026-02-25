import React from 'react';
import { usePlan } from '../contexts/PlanContext';
import './ProGate.css';

const ProGate = ({ children, feature, onNavigatePricing, inline = false }) => {
  const { isPro } = usePlan();

  if (isPro) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <div className="pro-gate-inline">
        <div className="pro-gate-content">
          <span className="pro-lock-icon">🔒</span>
          <p className="text-sm">
            You've reached the free tier limit. Upgrade to <strong>Master</strong> to unlock unlimited {feature || 'items'}.
          </p>
          <button 
            onClick={() => onNavigatePricing('pricing')}
            className="btn-primary mt-4 py-2 px-6 text-xs uppercase tracking-widest"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pro-gate-full min-h-screen flex items-center justify-center">
      <div className="pro-gate-card">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-3xl font-serif mb-2 text-primary">Master Tier Required</h2>
        <p className="text-muted tracking-widest uppercase text-xs mb-8">
          Unlock {feature || 'this feature'}
        </p>
        <p className="text-sm text-ink/80 mb-8 leading-relaxed">
          This area is reserved for scholars on the Master plan. Upgrade to access advanced planning tools, unlimited archives, and complete canvas customization.
        </p>
        <button 
          onClick={() => onNavigatePricing('pricing')}
          className="btn-primary w-full py-4 text-sm uppercase tracking-widest font-bold"
        >
          View Plans
        </button>
      </div>
    </div>
  );
};

export default ProGate;
