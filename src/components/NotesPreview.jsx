import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../pages/Dashboard.css'

const NotesPreview = ({ onNavigate }) => {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchRecentNotes()
  }, [user])

  const fetchRecentNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, folder, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(4)
      if (error) throw error
      if (data) setNotes(data)
    } catch (err) {
      console.error('Error fetching notes preview:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    const diff = Date.now() - new Date(dateStr)
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="archives-container">
      {loading ? (
        <p className="text-xs text-muted italic">Retrieving manuscripts...</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted italic">No manuscripts yet. Begin your library.</p>
      ) : (
        notes.map(note => (
          <div
            key={note.id}
            className="archive-item cursor-pointer"
            onClick={() => onNavigate('library')}
          >
            <div className="archive-folder">{note.folder || 'Uncategorized'} / {formatDate(note.updated_at)}</div>
            <div className="archive-title hover:italic transition-all">{note.title || 'Untitled'}</div>
          </div>
        ))
      )}
      <button
        className="text-sm font-medium uppercase tracking-widest text-accent mt-8 italic cursor-pointer hover:underline"
        onClick={() => onNavigate('library')}
      >
        Open Library →
      </button>
    </div>
  )
}

export default NotesPreview
