import React, { useState, useEffect, useRef, useCallback } from 'react'
import './CommandPalette.css'

const CommandPalette = ({ onNavigate, onAction }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const commands = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: '🏠', category: 'Navigate', action: () => onNavigate('dashboard') },
    { id: 'library', label: 'Go to Library', icon: '📚', category: 'Navigate', action: () => onNavigate('library') },
    { id: 'analytics', label: 'Go to Analytics', icon: '📊', category: 'Navigate', action: () => onNavigate('analytics') },
    { id: 'calendar', label: 'Go to Calendar', icon: '📅', category: 'Navigate', action: () => onNavigate('calendar') },
    { id: 'goals', label: 'Go to Goals', icon: '🎯', category: 'Navigate', action: () => onNavigate('goals') },
    { id: 'rooms', label: 'Go to Study Rooms', icon: '👥', category: 'Navigate', action: () => onNavigate('rooms') },
    { id: 'pricing', label: 'Go to Pricing', icon: '💎', category: 'Navigate', action: () => onNavigate('pricing') },
    { id: 'exams', label: 'Go to Exam Planner', icon: '📝', category: 'Navigate', action: () => onNavigate('exams') },
    { id: 'resume', label: 'Go to Resume Builder', icon: '📄', category: 'Navigate', action: () => onNavigate('resume') },
    { id: 'zen', label: 'Enter Zen Mode', icon: '🧘', category: 'Focus', action: () => onAction?.('zen') },
    { id: 'theme-toggle', label: 'Toggle Dark Mode', icon: '🌙', category: 'Settings', action: () => onAction?.('toggle-theme') },
    { id: 'new-task', label: 'Focus: New Task Input', icon: '✏️', category: 'Quick Action', action: () => onAction?.('focus-task') },
  ]

  const filtered = query.trim()
    ? commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  const toggle = useCallback(() => {
    setOpen(prev => {
      const next = !prev
      if (next) {
        setQuery('')
        setActiveIndex(0)
      }
      return next
    })
  }, [])

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, toggle])

  // Auto-focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset active index on filter change
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[activeIndex]
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const executeCommand = (cmd) => {
    setOpen(false)
    setQuery('')
    cmd.action()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault()
      executeCommand(filtered[activeIndex])
    }
  }

  if (!open) return null

  // Group by category
  const groups = {}
  filtered.forEach(cmd => {
    if (!groups[cmd.category]) groups[cmd.category] = []
    groups[cmd.category].push(cmd)
  })

  let globalIdx = 0

  return (
    <div className="cmd-palette-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <span className="cmd-search-icon">⌘</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        <div className="cmd-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="cmd-empty">No results found</div>
          )}
          {Object.entries(groups).map(([category, cmds]) => (
            <div key={category}>
              <div className="cmd-group-label">{category}</div>
              {cmds.map(cmd => {
                const idx = globalIdx++
                return (
                  <button
                    key={cmd.id}
                    className={`cmd-item ${idx === activeIndex ? 'cmd-item--active' : ''}`}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="cmd-item-icon">{cmd.icon}</span>
                    <span className="cmd-item-label">{cmd.label}</span>
                    {idx === activeIndex && <span className="cmd-item-hint">↵</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
