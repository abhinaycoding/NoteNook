import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const LegalModal = ({ title, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = title === 'Privacy Policy' ? (
    <>
      <span>Your privacy is our priority. We are committed to protecting your personal information.</span>
      <p>This Privacy Policy explains how NoteNook collects, uses, and safeguards your data when you use our application. We only collect information necessary to provide you with the best experience, such as your email address for account creation and your preferences to tailor your learning environment.</p>
      <span>Data Usage and Storage</span>
      <p>We do not sell your personal data to third parties. Your tasks, notes, and study logs are stored securely and are only accessible by you. We use standard encryption protocols to ensure your data remains safe.</p>
      <span>Cookies and Tracking</span>
      <p>We use essential cookies to keep you logged in and to remember your theme preferences. We do not use third-party tracking cookies for targeted advertising.</p>
      <span>Your Rights</span>
      <ul>
        <li>You have the right to access the data we hold about you.</li>
        <li>You can request the deletion of your account and all associated data at any time.</li>
        <li>You can opt-out of non-essential communications.</li>
      </ul>
      <p>If you have any questions about our privacy practices, please contact us at abhinaycoding@gmail.com.</p>
    </>
  ) : (
    <>
      <span>Welcome to NoteNook. By using our platform, you agree to these guidelines.</span>
      <p>NoteNook is a productivity tool designed to help students focus and manage their studies effectively. To maintain a positive and useful environment, we ask all users to adhere to the following guidelines.</p>
      <span>Acceptable Use</span>
      <p>You agree to use NoteNook for its intended purpose: organizing your study materials, tracking your time, and planning your tasks. You must not use the platform for any illegal activities or to store malicious content.</p>
      <span>Account Responsibilities</span>
      <ul>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You must provide accurate information when creating an account.</li>
        <li>Do not share your account or use another person's account without permission.</li>
      </ul>
      <span>Content Ownership</span>
      <p>You retain ownership of all the content (notes, tasks, goals) you create within NoteNook. We claim no ownership rights over your intellectual property.</p>
      <span>Service Modifications</span>
      <p>We reserve the right to modify or discontinue any feature of NoteNook at any time, with or without notice. We provide the service "as is" without any warranties.</p>
    </>
  );

  return createPortal(
    <StyledWrapper>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <article className="modal-container">
            <header className="modal-container-header">
              <span className="modal-container-title">
                {title === 'Privacy Policy' ? (
                  <svg aria-hidden="true" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M14 9V4H5v16h6.056c.328.417.724.785 1.18 1.085l1.39.915H3.993A.993.993 0 0 1 3 21.008V2.992C3 2.455 3.449 2 4.002 2h10.995L21 8v1h-7zm-2 2h9v5.949c0 .99-.501 1.916-1.336 2.465L16.5 21.498l-3.164-2.084A2.953 2.953 0 0 1 12 16.95V11zm2 5.949c0 .316.162.614.436.795l2.064 1.36 2.064-1.36a.954.954 0 0 0 .436-.795V13h-5v3.949z" fill="currentColor" />
                  </svg>
                )}
                {title}
              </span>
              <button className="icon-button" onClick={onClose}>
                <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor" />
                </svg>
              </button>
            </header>
            <section className="modal-container-body rtf">
              {content}
            </section>
            <footer className="modal-container-footer">
              <button className="button is-primary" onClick={onClose}>Understood</button>
            </footer>
          </article>
        </div>
      </div>
    </StyledWrapper>,
    document.body
  );
};

const StyledWrapper = styled.div`
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9000;
  }

  .button,
  .input,
  .select,
  .textarea {
    font: inherit;
  }

  a {
    color: inherit;
  }

  .modal-container {
    max-height: 80vh;
    max-width: 500px;
    width: 90vw;
    margin-left: auto;
    margin-right: auto;
    background-color: var(--bg-card);
    color: var(--text-primary);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lift);
    border: 1px solid var(--border);
  }

  .modal-container-header {
    padding: 16px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-container-title {
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1;
    font-weight: 700;
    font-size: 1.125rem;
  }

  .modal-container-title svg {
    width: 24px;
    height: 24px;
    color: var(--primary);
  }

  .modal-container-body {
    padding: 24px 32px 32px;
    overflow-y: auto;
  }
  
  .modal-container-body::-webkit-scrollbar {
    width: 6px;
  }
  .modal-container-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .modal-container-body::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 10px;
  }

  .rtf h1,
  .rtf h2,
  .rtf h3,
  .rtf h4,
  .rtf h5,
  .rtf h6 {
    font-weight: 700;
  }

  .rtf h1 {
    font-size: 1.5rem;
    line-height: 1.125;
  }

  .rtf h2 {
    font-size: 1.25rem;
    line-height: 1.25;
  }

  .rtf h3 {
    font-size: 1rem;
    line-height: 1.5;
  }

  .rtf > * + * {
    margin-top: 1em;
  }

  .rtf > * + :is(h1, h2, h3) {
    margin-top: 2em;
  }

  .rtf > :is(h1, h2, h3) + * {
    margin-top: 0.75em;
  }

  .rtf ul,
  .rtf ol {
    margin-left: 20px;
    list-style-position: inside;
  }

  .rtf ol {
    list-style: numeric;
  }

  .rtf ul {
    list-style: disc;
  }
  
  .rtf p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  .rtf span {
    font-weight: 600;
    font-size: 1rem;
    display: block;
    color: var(--text-primary);
  }
  
  .rtf li {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .modal-container-footer {
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid var(--border);
    gap: 12px;
    position: relative;
    background-color: var(--bg-card);
  }

  .modal-container-footer:after {
    content: "";
    display: block;
    position: absolute;
    top: -51px;
    left: 24px;
    right: 24px;
    height: 50px;
    flex-shrink: 0;
    background-image: linear-gradient(to top, var(--bg-card), transparent);
    pointer-events: none;
  }

  .button {
    padding: 10px 20px;
    border-radius: 8px;
    background-color: transparent;
    border: 0;
    font-weight: 600;
    cursor: auto;
    transition: 0.15s ease;
  }

  .button.is-ghost {
    color: var(--text-primary);
  }

  .button.is-ghost:hover, .button.is-ghost:focus {
    background-color: var(--border);
  }

  .button.is-primary {
    background-color: var(--primary);
    color: #fff;
  }

  .button.is-primary:hover, .button.is-primary:focus {
    background-color: var(--primary-hover);
  }

  .icon-button {
    padding: 0;
    border: 0;
    background-color: transparent;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    cursor: auto;
    border-radius: 8px;
    transition: 0.15s ease;
    color: var(--text-secondary);
  }

  .icon-button svg {
    width: 20px;
    height: 20px;
  }

  .icon-button:hover, .icon-button:focus {
    background-color: var(--border);
    color: var(--text-primary);
  }
`;

export default LegalModal;
