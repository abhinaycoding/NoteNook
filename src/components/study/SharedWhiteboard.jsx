import React, { useRef, useState, useEffect, useCallback } from 'react'

const SharedWhiteboard = ({ channel, user, onClose }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const isDrawing = useRef(false)
  const ctxRef = useRef(null)

  const [color, setColor] = useState('#10B981') // Default primary green
  const [lineWidth, setLineWidth] = useState(3)
  const [isEraser, setIsEraser] = useState(false)

  // ── Custom Drag Logic for Toolbar ────────────────────────────────────────
  // Start with a safe default, will refine in useEffect after mount
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 })
  const isDraggingToolbar = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Initialize position once we know the container size
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect()
      setToolbarPos({
        x: Math.max(10, width - 70), 
        y: Math.max(10, (height - 480) / 2)
      })
    }
  }, [])

  const handleDragStart = (e) => {
    e.stopPropagation() // Prevent drawing a dot on the canvas behind the dock
    isDraggingToolbar.current = true
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    // Store the exact pixel offset between the mouse click and the dock's top-left
    dragOffset.current = {
      x: clientX - toolbarPos.x,
      y: clientY - toolbarPos.y
    }
  }

  const handleDrag = useCallback((e) => {
    if (!isDraggingToolbar.current || !containerRef.current) return
    e.preventDefault() 
    e.stopPropagation() 

    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    // Map viewport coordinates to container-relative coordinates
    let newX = (clientX - rect.left) - dragOffset.current.x
    let newY = (clientY - rect.top) - dragOffset.current.y
    
    // Smooth bounding box relative to container
    newX = Math.max(10, Math.min(newX, rect.width - 55))
    newY = Math.max(10, Math.min(newY, rect.height - Math.min(490, rect.height - 20)))
    
    setToolbarPos({ x: newX, y: newY })
  }, [])

  const handleDragEnd = useCallback(() => {
    isDraggingToolbar.current = false
  }, [])

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

  // ── Initialize Canvas & Handle Resizing ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      // Get the actual display size of the container
      const { width, height } = container.getBoundingClientRect()
      
      // Set the internal pixel ratio for crisp lines on high DPI screens
      const ratio = window.devicePixelRatio || 1
      canvas.width = width * ratio
      canvas.height = height * ratio
      
      // Scale the context to match the CSS size
      const ctx = canvas.getContext('2d')
      ctx.scale(ratio, ratio)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctxRef.current = ctx
      
      // Restore previous lines here if we add persistent state later
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // ── Listen for Incoming Broadcasts ───────────────────────────────────────
  useEffect(() => {
    if (!channel || !ctxRef.current) return

    const drawLine = ({ x0, y0, x1, y1, color: strokeColor, width }) => {
      const ctx = ctxRef.current
      if (!ctx) return
      
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = width
      ctx.stroke()
      ctx.closePath()
    }

    channel.on('broadcast', { event: 'draw' }, (payload) => {
      // Ignore our own echoes if any
      if (payload.payload.user_id === user?.id) return
      drawLine(payload.payload)
    })
  }, [channel, user?.id])

  // ── Drawing Handlers ─────────────────────────────────────────────────────
  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e)
    isDrawing.current = true
    
    // We just want to setup the start point, maybe draw a dot later
    const ctx = ctxRef.current
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing.current || !ctxRef.current) return

    const { x, y } = getCoordinates(e)
    const ctx = ctxRef.current
    
    // Remember where we started this stroke segment for broadcasting
    const startX = ctx.canvas.lastX || x
    const startY = ctx.canvas.lastY || y

    const currentColor = isEraser ? '#FFFFFF' : color // Assuming white background for eraser
    const currentWidth = isEraser ? 20 : lineWidth

    ctx.lineTo(x, y)
    ctx.strokeStyle = currentColor
    ctx.lineWidth = currentWidth
    ctx.stroke()

    // Broadcast the segment to the room
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'draw',
        payload: {
          user_id: user?.id,
          x0: startX,
          y0: startY,
          x1: x,
          y1: y,
          color: currentColor,
          width: currentWidth
        }
      })
    }

    ctx.canvas.lastX = x
    ctx.canvas.lastY = y
  }

  const stopDrawing = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    const ctx = ctxRef.current
    if (ctx) {
      ctx.closePath()
      // Wipe the tracked last position so the next stroke starts fresh
      ctx.canvas.lastX = undefined 
      ctx.canvas.lastY = undefined
    }
  }

  const clearBoard = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    
    // Clear locally
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Tell room to clear
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'clear_board'
      })
    }
  }

  // Handle incoming clears
  useEffect(() => {
    if (!channel || !ctxRef.current) return
    channel.on('broadcast', { event: 'clear_board' }, () => {
       const canvas = canvasRef.current
       if (canvas && ctxRef.current) {
         ctxRef.current.clearRect(0, 0, canvas.width, canvas.height)
       }
    })
  }, [channel])


  // A curated palette of premium colors
  const COLORS = [
    '#111827', // Obsidian (Black)
    '#EF4444', // Cherry Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Ocean Blue
    '#8B5CF6', // Amethyst
    '#EC4899', // Rose Pink
    '#64748B'  // Slate Gray
  ]

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* ── Draggable Minimalist Palette (Toolbar) ── */}
      <div 
        className={isDraggingToolbar.current ? 'whiteboard-toolbar no-transition' : 'whiteboard-toolbar'}
        style={{ 
          left: `${toolbarPos.x}px`,
          top: `${toolbarPos.y}px`,
          cursor: isDraggingToolbar.current ? 'grabbing' : 'auto'
        }}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
      >
        
        {/* Drag Handle Area */}
        <div 
          className="wb-drag-handle" 
          title="Drag to move"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="wb-drag-pill" />
        </div>
        {/* Tools Section */}
        <div className="wb-tool-group">
          <button 
            onClick={() => setIsEraser(false)}
            className={`wb-tool-btn ${!isEraser ? 'active' : ''}`}
            title="Pen Tool"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
          </button>
          
          <button 
            onClick={() => setIsEraser(true)}
            className={`wb-tool-btn ${isEraser ? 'active' : ''}`}
            title="Eraser Tool"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path><path d="M22 21H7"></path><path d="m5 11 9 9"></path></svg>
          </button>
        </div>

        {/* Separator */}
        <div className="wb-separator" />

        {/* Brush Sizes Section */}
        <div className="wb-tool-group">
          {[
            { size: 3, label: 'Fine', uiSize: 5 },
            { size: 8, label: 'Medium', uiSize: 9 },
            { size: 16, label: 'Bold', uiSize: 15 }
          ].map(b => (
            <button
              key={b.size}
              onClick={() => { setLineWidth(b.size); setIsEraser(false); }}
              className={`wb-brush-btn ${lineWidth === b.size && !isEraser ? 'active' : ''}`}
              title={`${b.label} Brush`}
            >
              <div 
                style={{ 
                  width: `${b.uiSize}px`, 
                  height: `${b.uiSize}px`,
                  backgroundColor: lineWidth === b.size && !isEraser ? 'var(--ink)' : 'var(--text-secondary)',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }} 
              />
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="wb-separator" />

        {/* Colors Section */}
        <div className="wb-tool-group">
          {COLORS.map(c => (
            <button
              key={c}
              className={`wb-color-btn ${color === c && !isEraser ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => { setColor(c); setIsEraser(false) }}
              title={`Color: ${c}`}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="wb-separator" />

        {/* Global Actions Section */}
        <div className="wb-tool-group">
          <button 
            onClick={clearBoard}
            className="wb-action-btn"
            title="Clear Entire Board"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>

      {/* ── Top Right Actions ── */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20 }}>
        <button 
          onClick={onClose}
          className="wb-close-btn"
          title="Close Whiteboard"
        >
          <span>❌</span> Close
        </button>
      </div>

      {/* ── Canvas ── */}
      <div ref={containerRef} className="flex-1 w-full h-full relative" style={{ cursor: isEraser ? 'cell' : 'crosshair' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
        />
      </div>
      
    </div>
  )
}

export default SharedWhiteboard
