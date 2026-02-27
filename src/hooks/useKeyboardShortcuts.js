import { useEffect } from 'react'

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        // Exception: Escape key can still trigger to blur/close
        if (e.key !== 'Escape') {
          return
        }
      }

      // Check if the pressed key matches any of our shortcuts
      const matchedShortcut = shortcuts.find(s => {
        // Handle case-insensitive match for letters (e.g. 'n' or 'N')
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase() || s.key === e.code
        const ctrlMatch = s.ctrl ? e.ctrlKey || e.metaKey : true
        const shiftMatch = s.shift ? e.shiftKey : true
        const altMatch = s.alt ? e.altKey : true

        return keyMatch && ctrlMatch && shiftMatch && altMatch
      })

      if (matchedShortcut) {
        e.preventDefault() // prevent scrolling on space, etc.
        matchedShortcut.action(e)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
