import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NoteEditor from '../components/NoteEditor'
import ProGate from '../components/ProGate'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import './LibraryPage.css'

const LibraryPage = ({ onNavigate }) => {
  const { user, session } = useAuth()
  const { isPro } = usePlan()
  const toast = useToast()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState('All')
  
  const hasReachedLimit = !isPro && notes.length >= 10
  
  // Fetch notes on mount
  useEffect(() => {
    let isMounted = true
    if (!user || !session) return
    
    const fetchNotes = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notes?user_id=eq.${user.id}&select=*&order=updated_at.desc`
        const res = await fetch(url, { headers: getHeaders() })
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const data = await res.json()
        
        if (isMounted) setNotes(data || [])
      } catch (error) {
        console.error('Error fetching notes:', error.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    fetchNotes()
    return () => { isMounted = false }
  }, [user, session])

  const getHeaders = (prefer = 'return=representation') => ({
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
    ...(prefer && { 'Prefer': prefer })
  })

  const handleCreateNote = async () => {
    if (!session) return
    try {
      const newNote = {
        user_id: user.id,
        title: 'Untitled Document',
        content: '',
        folder: activeFolder === 'All' ? 'Uncategorized' : activeFolder
      }
      
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notes`
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newNote)
      })
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const inserted = await res.json()
      
      if (inserted && inserted.length > 0) {
        setNotes([inserted[0], ...notes])
        setActiveNoteId(inserted[0].id)
        toast('New manuscript created.', 'success')
      }
    } catch (error) {
      toast('Failed to create note.', 'error')
      console.error('Error creating note:', error.message)
    }
  }

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Erase this manuscript permanently?')) return;
    if (!session) return;
    
    // Optimistic UI
    const previousNotes = [...notes];
    setNotes(notes.filter(n => n.id !== id))
    if (activeNoteId === id) setActiveNoteId(null)
    
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notes?id=eq.${id}`
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders('return=minimal')
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast('Manuscript erased from the Archives.', 'info')
    } catch (error) {
      toast('Failed to delete note.', 'error')
      console.error('Error deleting note:', error.message)
      setNotes(previousNotes) // Revert
    }
  }

  const handleUpdateNote = (id, updatedFields) => {
    setNotes(notes.map(note => note.id === id ? { ...note, ...updatedFields } : note))
  }

  // Derive folders dynamically from notes
  const folders = ['All', ...new Set(notes.map(n => n.folder).filter(Boolean))]

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (note.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = activeFolder === 'All' || note.folder === activeFolder
    return matchesSearch && matchesFolder
  })

  // Find the active note object
  const activeNote = notes.find(n => n.id === activeNoteId)

  return (
    <div className="canvas-layout">
      <header className="canvas-header container">
        <div className="flex justify-between items-end border-b border-ink pb-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="logo-mark font-serif cursor-pointer text-4xl text-primary" onClick={() => onNavigate('dashboard')}>FF.</div>
            <h1 className="text-xl font-serif text-muted italic ml-4 line-left pl-4">The Library</h1>
          </div>
          <div className="flex gap-8 items-end text-right">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="uppercase tracking-widest text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer"
            >
              ← Return to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="library-container">
        
        {/* Left Pane: Directory */}
        <aside className="library-directory">
          <div className="directory-header">
            <h2 className="text-xl font-serif">The Archives</h2>
            <button 
              onClick={handleCreateNote} 
              className={`btn-icon ${hasReachedLimit ? 'opacity-50 cursor-not-allowed' : ''}`} 
              disabled={hasReachedLimit}
              aria-label="New Note"
              title={hasReachedLimit ? "Limit reached" : "New Note"}
            >
              +
            </button>
          </div>

          <div className="directory-search">
            <input 
              type="text" 
              placeholder="Search manuscripts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="directory-folders">
            {folders.map(folder => (
              <button 
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`folder-btn ${activeFolder === folder ? 'active' : ''}`}
              >
                {folder}
              </button>
            ))}
          </div>

          <div className="directory-list">
            {loading ? (
              <div className="text-xs text-muted italic">Dusting off the shelves...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-xs text-muted italic">No manuscripts found.</div>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id} 
                  className={`note-row ${activeNoteId === note.id ? 'active' : ''}`}
                >
                  <div 
                    className="note-row-content"
                    onClick={() => setActiveNoteId(note.id)}
                  >
                    <div className="note-row-title">{note.title || 'Untitled'}</div>
                    <div className="note-row-meta">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="note-delete-btn"
                    title="Delete manuscript"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Pane: Editor */}
        <section className="library-editor-pane">
          {activeNote ? (
            <NoteEditor 
              note={activeNote} 
              onUpdate={handleUpdateNote} 
              user={user} 
            />
          ) : (
            <div className="empty-editor-state">
              {hasReachedLimit ? (
                <ProGate feature="manuscripts" inline onNavigatePricing={onNavigate} />
              ) : (
                <>
                  <h3 className="text-3xl font-serif text-muted">Select a manuscript to begin drafting.</h3>
                  <p className="text-sm uppercase tracking-widest text-muted mt-4">Or inscribe a new one.</p>
                </>
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

export default LibraryPage
