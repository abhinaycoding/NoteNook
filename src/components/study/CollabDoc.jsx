import React, { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { db } from '../../lib/firebase'
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import './CollabDoc.css'

const SAVE_DEBOUNCE_MS = 1500
const docPath = 'room_docs'

const CollabDoc = ({ roomId, channelId, channelName, user }) => {
  const editorRef    = useRef(null)
  const quillRef     = useRef(null)
  const saveTimer    = useRef(null)
  const isRemote     = useRef(false)
  const unsubRef     = useRef(null)

  const [saveStatus, setSaveStatus] = useState('saved')
  const [wordCount, setWordCount]   = useState(0)

  const docId = `${roomId}_${channelId}`

  useEffect(() => {
    if (quillRef.current) return   // already initialized

    // ── Build Quill ──────────────────────────────────────────────────────────
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: `Start writing in #${channelName}...`,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['clean'],
        ],
      },
    })
    quillRef.current = quill

    // ── Load initial content from Firestore ──────────────────────────────────
    getDoc(doc(db, docPath, docId)).then(snap => {
      if (snap.exists()) {
        const html = snap.data()?.html
        if (html) {
          isRemote.current = true
          quill.root.innerHTML = html
          isRemote.current = false
        }
      }
    }).catch(() => {})

    // ── Real-time listener for other users' edits ────────────────────────────
    const unsub = onSnapshot(doc(db, docPath, docId), snap => {
      if (!snap.exists()) return
      const data = snap.data()
      // Skip if this update was made by current user
      if (data?.last_editor === user?.uid) return
      if (!data?.html) return
      isRemote.current = true
      const sel = quill.getSelection()
      quill.root.innerHTML = data.html
      if (sel) quill.setSelection(sel, 'silent')
      isRemote.current = false
    })
    unsubRef.current = unsub

    // ── On-change handler: debounce save ─────────────────────────────────────
    quill.on('text-change', (_delta, _old, source) => {
      if (source !== 'user' || isRemote.current) return

      const text = quill.getText()
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
      setSaveStatus('unsaved')

      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const html = quill.root.innerHTML
        setSaveStatus('saving')
        try {
          await setDoc(doc(db, docPath, docId), {
            html,
            last_editor: user?.uid || 'guest',
            last_editor_name: user?.displayName || 'Scholar',
            updated_at: serverTimestamp(),
            room_id: roomId,
            channel_id: channelId,
          })
          setSaveStatus('saved')
        } catch {
          setSaveStatus('unsaved')
        }
      }, SAVE_DEBOUNCE_MS)
    })

    return () => {
      unsub()
      clearTimeout(saveTimer.current)
    }
  }, [docId])   // only re-init if docId changes (channel switch)

  const statusIcon = {
    saved:   { icon: '✓',  label: 'Saved',    cls: 'saved'   },
    saving:  { icon: '⏳', label: 'Saving…',  cls: 'saving'  },
    unsaved: { icon: '●',  label: 'Unsaved',   cls: 'unsaved' },
  }[saveStatus]

  return (
    <div className="collab-doc-panel">
      {/* Header */}
      <div className="collab-doc-header">
        <div className="collab-doc-title">
          <span className="collab-doc-icon">📄</span>
          <span className="collab-doc-name">#{channelName}</span>
        </div>
        <div className="collab-doc-meta">
          <span className="collab-word-count">{wordCount} words</span>
          <div className={`collab-save-status ${statusIcon.cls}`}>
            <span>{statusIcon.icon}</span>
            <span>{statusIcon.label}</span>
          </div>
        </div>
      </div>

      {/* Quill Editor */}
      <div className="collab-doc-editor-wrap">
        <div ref={editorRef} className="collab-doc-editor" />
      </div>
    </div>
  )
}

export default CollabDoc
