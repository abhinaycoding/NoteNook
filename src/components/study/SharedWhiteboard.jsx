import React, { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '../../lib/firebase'
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, limit, Timestamp } from 'firebase/firestore'

const COLORS = [
  '#111827', '#EF4444', '#F59E0B', '#10B981',
  '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'
]

const SharedWhiteboard = ({ roomId, user, onClose }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })  // FIX: use ref instead of canvas property
  const ctxRef = useRef(null)

  const [color, setColor] = useState('#111827')
  const [lineWidth, setLineWidth] = useState(3)
  const [isEraser, setIsEraser] = useState(false)

  // ── Draggable Toolbar ────────────────────────────────────────────────────
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 })
  const isDraggingToolbar = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      setToolbarPos({ x: Math.max(10, width - 70), y: Math.max(10, (height - 420) / 2) })
    }
  }, [])

  const handleDragStart = (e) => {
    e.stopPropagation()
    isDraggingToolbar.current = true
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragOffset.current = { x: clientX - toolbarPos.x, y: clientY - toolbarPos.y }
  }

  const handleDrag = useCallback((e) => {
    if (!isDraggingToolbar.current || !containerRef.current) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    let newX = (clientX - rect.left) - dragOffset.current.x
    let newY = (clientY - rect.top) - dragOffset.current.y
    newX = Math.max(10, Math.min(newX, rect.width - 55))
    newY = Math.max(10, Math.min(newY, rect.height - 420))
    setToolbarPos({ x: newX, y: newY })
  }, [])

  const handleDragEnd = useCallback(() => { isDraggingToolbar.current = false }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchmove', handleDrag, { passive: false })
    document.addEventListener('touchend', handleDragEnd)
    return () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDrag)
      document.removeEventListener('touchend', handleDragEnd)
    }
  }, [handleDrag, handleDragEnd])

  // ── Canvas Setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      // Save existing drawing before resize
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempCanvas.getContext('2d').drawImage(canvas, 0, 0)

      canvas.width = width * ratio
      canvas.height = height * ratio
      const ctx = canvas.getContext('2d')
      ctx.scale(ratio, ratio)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      // Restore old drawing
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height)
      ctxRef.current = ctx
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const drawLine = useCallback(({ x0, y0, x1, y1, color: strokeColor, width, type }) => {
    const ctx = ctxRef.current
    if (!ctx) return
    if (type === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = width
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = width
    }
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.closePath()
    ctx.globalCompositeOperation = 'source-over'
  }, [])

  // ── Remote Stroke Listener ────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return

    const cutoff = new Date(Date.now() - 30000)
    const q = query(
      collection(db, 'room_whiteboard'),
      where('room_id', '==', roomId),
      where('created_at', '>', Timestamp.fromDate(cutoff)),
      orderBy('created_at', 'asc'),
      limit(300)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          if (data.user_id === user?.uid) return  // skip own strokes (already drawn locally)
          if (data.type === 'draw' || data.type === 'erase') drawLine(data)
          if (data.type === 'clear') {
            const canvas = canvasRef.current
            if (canvas && ctxRef.current) ctxRef.current.clearRect(0, 0, canvas.width, canvas.height)
          }
        }
      })
    })

    return () => unsubscribe()
  }, [roomId, user?.uid, drawLine])

  // ── Drawing ───────────────────────────────────────────────────────────────
  const getCoords = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDrawing = (e) => {
    const { x, y } = getCoords(e)
    isDrawing.current = true
    lastPos.current = { x, y }
  }

  const draw = async (e) => {
    if (!isDrawing.current || !ctxRef.current || !roomId || !user?.uid) return
    const { x, y } = getCoords(e)
    const { x: x0, y: y0 } = lastPos.current

    const strokeType = isEraser ? 'erase' : 'draw'
    const strokeColor = color
    const strokeWidth = isEraser ? 24 : lineWidth

    drawLine({ x0, y0, x1: x, y1: y, color: strokeColor, width: strokeWidth, type: strokeType })
    lastPos.current = { x, y }

    // Throttle Firestore writes to every other call
    if (Math.random() > 0.5) {
      try {
        await addDoc(collection(db, 'room_whiteboard'), {
          room_id: roomId,
          user_id: user.uid,
          type: strokeType,
          x0, y0, x1: x, y1: y,
          color: strokeColor,
          width: strokeWidth,
          created_at: serverTimestamp()
        })
      } catch (_) {}
    }
  }

  const stopDrawing = () => { isDrawing.current = false }

  const clearBoard = async () => {
    const canvas = canvasRef.current
    if (!canvas || !ctxRef.current || !roomId || !user?.uid) return
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height)
    try {
      await addDoc(collection(db, 'room_whiteboard'), {
        room_id: roomId, user_id: user.uid, type: 'clear', created_at: serverTimestamp()
      })
    } catch (_) {}
  }

  const cursorStyle = isEraser ? 'cell' : 'crosshair'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', background: 'var(--bg-color)' }}>

      {/* Close Button */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 30 }}>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--bg-card)', border: '1px solid var(--ink)',
            color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '0.4rem 1rem', cursor: 'pointer',
            boxShadow: '2px 2px 0px var(--ink)',
            fontFamily: 'var(--font-sans)', transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        >
          ✕ Close
        </button>
      </div>

      {/* Floating Toolbar */}
      <div
        className="whiteboard-toolbar"
        style={{
          position: 'absolute',
          left: `${toolbarPos.x}px`,
          top: `${toolbarPos.y}px`,
          zIndex: 20,
          cursor: isDraggingToolbar.current ? 'grabbing' : 'auto',
          transition: isDraggingToolbar.current ? 'none' : 'box-shadow 0.2s'
        }}
      >
        {/* Drag Handle */}
        <div className="wb-drag-handle" onMouseDown={handleDragStart} onTouchStart={handleDragStart} title="Drag to move">
          <div className="wb-drag-pill" />
        </div>

        {/* Pen / Eraser */}
        <div className="wb-tool-group">
          <button onClick={() => setIsEraser(false)} className={`wb-tool-btn ${!isEraser ? 'active' : ''}`} title="Pen">
            ✏️
          </button>
          <button onClick={() => setIsEraser(true)} className={`wb-tool-btn ${isEraser ? 'active' : ''}`} title="Eraser">
            🧹
          </button>
        </div>

        <div className="wb-separator" />

        {/* Brush Sizes */}
        <div className="wb-tool-group">
          {[{ size: 3, dot: 5 }, { size: 8, dot: 9 }, { size: 16, dot: 15 }].map(b => (
            <button
              key={b.size}
              onClick={() => { setLineWidth(b.size); setIsEraser(false) }}
              className={`wb-brush-btn ${lineWidth === b.size && !isEraser ? 'active' : ''}`}
              title="Brush size"
            >
              <div style={{
                width: b.dot, height: b.dot,
                background: lineWidth === b.size && !isEraser ? 'var(--ink)' : 'var(--text-secondary)',
                borderRadius: '50%', transition: 'background 0.2s'
              }} />
            </button>
          ))}
        </div>

        <div className="wb-separator" />

        {/* Colors */}
        <div className="wb-tool-group">
          {COLORS.map(c => (
            <button
              key={c}
              className={`wb-color-btn ${color === c && !isEraser ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => { setColor(c); setIsEraser(false) }}
              title={c}
            />
          ))}
        </div>

        <div className="wb-separator" />

        {/* Clear */}
        <div className="wb-tool-group">
          <button onClick={clearBoard} className="wb-action-btn" title="Clear board" style={{ fontSize: '1rem' }}>
            🗑️
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ flex: 1, width: '100%', position: 'relative', cursor: cursorStyle }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ width: '100%', height: '100%', touchAction: 'none', display: 'block' }}
        />
      </div>
    </div>
  )
}

export default SharedWhiteboard
