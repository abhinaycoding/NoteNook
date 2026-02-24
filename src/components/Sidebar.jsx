import React from 'react'
import './Sidebar.css'

const Sidebar = ({ activeTab, setActiveTab, onNavigate }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path> },
    { id: 'tasks', label: 'Tasks', icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path> },
    { id: 'notes', label: 'Notes', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"></polyline></> },
    { id: 'timer', label: 'Focus Timer', icon: <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></> },
    { id: 'analytics', label: 'Analytics', icon: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"></path></> },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={() => onNavigate('landing')}>
        <div className="logo-icon"></div>
        <span className="logo-text">FocusFlow</span>
      </div>

      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
              {tab.icon}
            </svg>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span className="nav-label" onClick={() => onNavigate('landing')}>Log out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
