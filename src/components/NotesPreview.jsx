import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/LanguageContext'
import { EmptyArchive } from './EmptyStateIllustrations'
import '../pages/Dashboard.css'

const NotesPreview = ({ onNavigate }) => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('id, title, folder, updated_at')
          .eq('user_id', user)
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

    if (user) fetchRecentNotes()
  }, [user])

  const formatDate = (dateStr) => {
    const diff = Date.now() - new Date(dateStr)
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return t('notes.justNow')
    if (hours < 24) return `${hours}${t('notes.hAgo')}`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}${t('notes.dAgo')}`
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="archives-container">
      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="skeleton skeleton-text" style={{ height: '48px' }} />
          <div className="skeleton skeleton-text" style={{ height: '48px', width: '85%' }} />
          <div className="skeleton skeleton-text" style={{ height: '48px', width: '95%' }} />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-6 opacity-70">
          <EmptyArchive size={100} />
          <p className="font-serif italic mt-2">{t('notes.emptyTitle')}</p>
          <p className="text-xs mt-1 uppercase tracking-widest text-muted">{t('notes.emptySubtitle')}</p>
        </div>
      ) : (
        notes.map(note => (
          <div
            key={note.id}
            className="archive-item cursor-pointer"
            onPointerDown={(e) => {
              // Ignore right clicks
              if (e.button !== 0) return;
              e.preventDefault(); // Stop dnd-kit from starting a drag
              localStorage.setItem('ff_open_note', note.id)
              onNavigate('library')
            }}
          >
            <div className="archive-folder">{note.folder || t('notes.uncategorized')} / {formatDate(note.updated_at)}</div>
            <div className="archive-title hover:italic transition-all">{note.title || t('notes.untitled')}</div>
          </div>
        ))
      )}
      <button
        className="text-sm font-medium uppercase tracking-widest text-accent mt-8 italic cursor-pointer hover:underline"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          onNavigate('library');
        }}
      >
        {t('notes.openLibrary')}
      </button>
    </div>
  )
}

export default NotesPreview
