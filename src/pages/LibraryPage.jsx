import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NoteEditor from '../components/NoteEditor'
import './LibraryPage.css'

const LibraryPage = ({ onNavigate, user }) => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState('All')
  
  // Fetch notes on mount
  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        
      if (error) throw error
      if (data) setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async () => {
    try {
      const newNote = {
        user_id: user.id,
        title: 'Untitled Document',
        content: '',
        folder: activeFolder === 'All' ? 'Uncategorized' : activeFolder
      }
      
      const { data, error } = await supabase
        .from('notes')
        .insert([newNote])
        .select()
        .single()
        
      if (error) throw error
      if (data) {
        setNotes([data, ...notes])
        setActiveNoteId(data.id)
      }
    } catch (error) {
      console.error('Error creating note:', error.message)
    }
  }

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Erase this manuscript permanently?')) return;
    
    // Optimistic UI
    const previousNotes = [...notes];
    setNotes(notes.filter(n => n.id !== id))
    if (activeNoteId === id) setActiveNoteId(null)
    
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
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
            <button onClick={handleCreateNote} className="btn-icon" aria-label="New Note">
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
              <h3 className="text-3xl font-serif text-muted">Select a manuscript to begin drafting.</h3>
              <p className="text-sm uppercase tracking-widest text-muted mt-4">Or inscribe a new one.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

export default LibraryPage
