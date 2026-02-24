import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const NoteEditor = ({ note, onUpdate, user }) => {
  const [title, setTitle] = useState(note.title || '')
  const [content, setContent] = useState(note.content || '')
  const [folder, setFolder] = useState(note.folder || 'Uncategorized')
  const [saveStatus, setSaveStatus] = useState('Saved')
  const [wordCount, setWordCount] = useState(0)

  const saveTimeoutRef = useRef(null)

  // Sync state when switching notes
  useEffect(() => {
    setTitle(note.title || '')
    setContent(note.content || '')
    setFolder(note.folder || 'Uncategorized')
    setSaveStatus('Saved')
    countWords(note.content || '')
  }, [note.id])

  const countWords = (text) => {
    const words = text.trim().split(/\s+/).filter(Boolean)
    setWordCount(words.length)
  }

  const debounceSave = (updatedFields) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    setSaveStatus('Saving...')
    onUpdate(note.id, updatedFields)

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('notes')
          .update({ ...updatedFields, updated_at: new Date().toISOString() })
          .eq('id', note.id)
        if (error) throw error
        setSaveStatus('✓ Saved')
      } catch (err) {
        console.error('Auto-save error:', err.message)
        setSaveStatus('⚠ Error')
      }
    }, 900)
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    debounceSave({ title: e.target.value })
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    countWords(e.target.value)
    debounceSave({ content: e.target.value })
  }

  const handleFolderChange = (e) => {
    setFolder(e.target.value)
    debounceSave({ folder: e.target.value })
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [])

  return (
    <div className="note-editor-wrapper">
      <header className="editor-header">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Document Title"
          className="editor-title-input"
        />
        <div className="editor-meta-bar">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted uppercase tracking-widest">Folder:</span>
            <input
              type="text"
              value={folder}
              onChange={handleFolderChange}
              placeholder="Folder Name"
              className="editor-folder-input"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {wordCount > 0 ? `${wordCount} words` : ''}
            </span>
            <span className={`save-status ${saveStatus.includes('Error') ? 'text-danger' : ''}`}>
              {saveStatus}
            </span>
          </div>
        </div>
      </header>

      <textarea
        className="editor-textarea"
        value={content}
        onChange={handleContentChange}
        placeholder="Begin your treatise here..."
      />
    </div>
  )
}

export default NoteEditor
