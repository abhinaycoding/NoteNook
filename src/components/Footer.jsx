import React, { useState } from 'react'
import LegalModal from './LegalModal'
import './Footer.css'

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null)

  return (
    <footer className="editorial-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <h2 className="text-4xl font-serif text-primary">NoteNook.</h2>
            <p className="text-sm text-muted mt-4 max-w-xs">
              We have traded scattered digital boards for an elegant, distraction-free ledger. A curated canvas for the modern student.
            </p>
          </div>
          
          <div className="footer-links-container">
            <div className="footer-column">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links text-sm font-medium">
                <li><button type="button" onClick={() => setActiveModal('Privacy Policy')} style={{ cursor: 'pointer', textAlign: 'left', padding: 0 }}>Privacy Policy</button></li>
                <li><button type="button" onClick={() => setActiveModal('Guidelines')} style={{ cursor: 'pointer', textAlign: 'left', padding: 0 }}>Guidelines</button></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">Access</h4>
              <ul className="footer-links text-sm font-medium">
                <li><a href="#subscribe">The Canvas (Free)</a></li>
                <li><a href="#subscribe">The Scholar Pass (Pro)</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">Connect</h4>
              <ul className="footer-links text-sm font-medium">
                <li><a href="mailto:abhinaycoding@gmail.com" className="footer-mail-link">Contact Us</a></li>
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
