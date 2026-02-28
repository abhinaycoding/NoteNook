import React from 'react';
import { usePlan } from '../contexts/PlanContext';
import { useTranslation } from '../contexts/LanguageContext';
import './ProGate.css';

const ProGate = ({ children, feature, onNavigatePricing, inline = false }) => {
  const { isPro } = usePlan();
  const { t } = useTranslation();

  if (isPro) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <div className="pro-gate-inline">
        <div className="pro-gate-content">
          <span className="pro-lock-icon">🔒</span>
          <p className="text-sm">
            {t('proGate.freeLimitReached')} <strong>{t('proGate.master')}</strong> {t('proGate.toUnlock')} {feature || t('proGate.items')}.
          </p>
          <button 
            onClick={() => onNavigatePricing('pricing')}
            className="btn-primary mt-4 py-2 px-6 text-xs uppercase tracking-widest"
          >
            {t('proGate.viewPlans')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pro-gate-full min-h-screen flex items-center justify-center">
      <div className="pro-gate-card">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-3xl font-serif mb-2 text-primary">{t('proGate.masterRequired')}</h2>
        <p className="text-muted tracking-widest uppercase text-xs mb-8">
          {t('proGate.unlock')} {feature || t('proGate.thisFeature')}
        </p>
        <p className="text-sm text-ink/80 mb-8 leading-relaxed">
          {t('proGate.proDescription')}
        </p>
        <button 
          onClick={() => onNavigatePricing('pricing')}
          className="btn-primary w-full py-4 text-sm uppercase tracking-widest font-bold"
        >
          {t('proGate.viewPlans')}
        </button>
      </div>
    </div>
  );
};

export default ProGate;
