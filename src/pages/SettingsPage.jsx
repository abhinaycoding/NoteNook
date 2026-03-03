import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../contexts/PlanContext';
import './SettingsPage.css';

const SettingsPage = ({ onNavigate }) => {
  const { theme, setThemeById, themes, isDark, toggle } = useTheme();
  const { language, setLanguage, languages } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const { isPro } = usePlan();

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const handleSupportSend = () => {
    if (!supportMsg.trim()) return;
    // Simulate sending (can wire to email/firebase later)
    setSupportSent(true);
    setSupportMsg('');
    setTimeout(() => setSupportSent(false), 3000);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your preferences, appearance, and account.</p>
      </div>

      <div className="settings-grid">

        {/* ── Appearance ── */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🎨</span>
            <div>
              <h2 className="settings-card-title">Appearance</h2>
              <p className="settings-card-desc">Choose your theme and color scheme</p>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-row-label">Color Mode</span>
            <button className="settings-toggle-btn" onClick={toggle}>
              {isDark ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>

          <div className="settings-theme-grid">
            {themes.map(t => (
              <button
                key={t.id}
                className={`theme-chip ${theme === t.id ? 'theme-chip-active' : ''}`}
                onClick={() => setThemeById(t.id)}
              >
                <span className="theme-chip-icon">{t.icon}</span>
                <span className="theme-chip-label">{t.label}</span>
                {theme === t.id && <span className="theme-chip-check">✓</span>}
              </button>
            ))}
          </div>
        </section>

        {/* ── Language ── */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🌐</span>
            <div>
              <h2 className="settings-card-title">Language</h2>
              <p className="settings-card-desc">Choose your preferred display language</p>
            </div>
          </div>
          <div className="settings-lang-grid">
            {languages.map(l => (
              <button
                key={l.code}
                className={`lang-chip ${language === l.code ? 'lang-chip-active' : ''}`}
                onClick={() => setLanguage(l.code)}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {language === l.code && <span className="lang-check">✓</span>}
              </button>
            ))}
          </div>
        </section>

        {/* ── Account ── */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">👤</span>
            <div>
              <h2 className="settings-card-title">Account</h2>
              <p className="settings-card-desc">Your account details and plan</p>
            </div>
          </div>
          <div className="settings-account-info">
            <div className="account-avatar">{(profile?.full_name?.[0] || 'S').toUpperCase()}</div>
            <div>
              <p className="account-name">{profile?.full_name || 'Scholar'}</p>
              <p className="account-email">{user?.email}</p>
              <span className={`account-plan-badge ${isPro ? 'pro' : 'free'}`}>
                {isPro ? '⭐ Pro Member' : '🆓 Free Plan'}
              </span>
            </div>
          </div>
          <div className="settings-actions">
            <button className="settings-action-btn" onClick={() => onNavigate('profile')}>
              Edit Profile
            </button>
            {!isPro && (
              <button className="settings-action-btn primary" onClick={() => onNavigate('pricing')}>
                Upgrade to Pro ✨
              </button>
            )}
          </div>
        </section>

        {/* ── Notifications ── */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🔔</span>
            <div>
              <h2 className="settings-card-title">Notifications</h2>
              <p className="settings-card-desc">Coming soon — control what alerts you receive</p>
            </div>
          </div>
          <div className="settings-coming-soon">
            <span>🚧</span>
            <p>Notification preferences will be available soon.</p>
            <p className="settings-coming-sub">Friend requests, study reminders, and system announcements.</p>
          </div>
        </section>

        {/* ── Privacy ── */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">🔒</span>
            <div>
              <h2 className="settings-card-title">Privacy</h2>
              <p className="settings-card-desc">Coming soon — manage your data and visibility</p>
            </div>
          </div>
          <div className="settings-coming-soon">
            <span>🚧</span>
            <p>Profile visibility and data settings coming soon.</p>
            <p className="settings-coming-sub">Control who can see your profile, study stats, and activity.</p>
          </div>
        </section>

        {/* ── Support ── */}
        <section className="settings-card settings-support-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">💬</span>
            <div>
              <h2 className="settings-card-title">Help & Support</h2>
              <p className="settings-card-desc">Reach out if something's broken or you have feedback</p>
            </div>
          </div>

          {!supportOpen ? (
            <div className="support-options">
              <button className="support-option-btn" onClick={() => setSupportOpen(true)}>
                <span>✉️</span>
                <div>
                  <p className="support-opt-title">Send a Message</p>
                  <p className="support-opt-sub">Report a bug or ask a question</p>
                </div>
                <span className="support-arrow">→</span>
              </button>
              <a className="support-option-btn" href="https://github.com/abhinaycoding" target="_blank" rel="noreferrer">
                <span>⭐</span>
                <div>
                  <p className="support-opt-title">GitHub</p>
                  <p className="support-opt-sub">Follow the project on GitHub</p>
                </div>
                <span className="support-arrow">→</span>
              </a>
            </div>
          ) : (
            <div className="support-form">
              <textarea
                className="support-textarea"
                placeholder="Describe your issue or feedback…"
                rows={4}
                value={supportMsg}
                onChange={e => setSupportMsg(e.target.value)}
              />
              <div className="support-form-actions">
                <button className="settings-action-btn" onClick={() => setSupportOpen(false)}>Cancel</button>
                <button
                  className="settings-action-btn primary"
                  onClick={handleSupportSend}
                  disabled={!supportMsg.trim()}
                >
                  {supportSent ? '✓ Sent!' : 'Send Message'}
                </button>
              </div>
              {supportSent && <p className="support-sent-msg">✅ Thank you! We'll get back to you soon.</p>}
            </div>
          )}
        </section>

        {/* ── Danger Zone ── */}
        <section className="settings-card settings-danger-card">
          <div className="settings-card-header">
            <span className="settings-card-icon">⚠️</span>
            <div>
              <h2 className="settings-card-title">Danger Zone</h2>
              <p className="settings-card-desc">Irreversible actions</p>
            </div>
          </div>
          <button className="settings-danger-btn" onClick={async () => { await signOut(); onNavigate('landing'); }}>
            🚪 Log Out
          </button>
        </section>

      </div>
    </div>
  );
};

export default SettingsPage;
