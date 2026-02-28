import React, { useState } from 'react'
import LegalModal from './LegalModal'
import { useTranslation } from '../contexts/LanguageContext'
import './Footer.css'

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null)
  const { t } = useTranslation()

  return (
    <footer className="editorial-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <h2 className="text-4xl font-serif text-primary">NoteNook.</h2>
            <p className="text-sm text-muted mt-4 max-w-xs">
              {t('footer.tagline')}
            </p>
          </div>
          
          <div className="footer-links-container">
            <div className="footer-column">
              <h4 className="footer-heading">{t('footer.legal')}</h4>
              <ul className="footer-links text-sm font-medium">
                <li><button type="button" onClick={() => setActiveModal('Privacy Policy')} style={{ cursor: 'pointer', textAlign: 'left', padding: 0 }}>{t('footer.privacyPolicy')}</button></li>
                <li><button type="button" onClick={() => setActiveModal('Guidelines')} style={{ cursor: 'pointer', textAlign: 'left', padding: 0 }}>{t('footer.guidelines')}</button></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">{t('footer.access')}</h4>
              <ul className="footer-links text-sm font-medium">
                <li><a href="#subscribe">{t('footer.canvasFree')}</a></li>
                <li><a href="#subscribe">{t('footer.scholarPro')}</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">{t('footer.connect')}</h4>
              <ul className="footer-links text-sm font-medium">
                <li><a href="mailto:abhinaycoding@gmail.com" className="footer-mail-link">{t('footer.contactUs')}</a></li>
                <li><a href="https://x.com/AbhinayCode" target="_blank" rel="noreferrer">X</a></li>
                <li><a href="https://github.com/abhinaycoding?tab=overview&from=2026-02-01&to=2026-02-27" target="_blank" rel="noreferrer">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom border-t border-ink flex justify-between items-center py-6 mt-16 text-xs uppercase tracking-widest font-bold text-muted">
          <div>© {new Date().getFullYear()} NoteNook Publishing</div>
          <a href="mailto:abhinaycoding@gmail.com" className="hover-text-primary transition-colors">abhinaycoding@gmail.com</a>
        </div>
      </div>
      
      <LegalModal 
        isOpen={activeModal !== null} 
        title={activeModal} 
        onClose={() => setActiveModal(null)} 
      />
    </footer>
  )
}

export default Footer
