import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

const CustomCursor = () => {
  useEffect(() => {
    const cursor = document.getElementById('custom-cursor');
    
    // Hide default cursor globally with maximum force
    const style = document.createElement('style');
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    const moveCursor = (e) => {
      if(cursor) {
        // Use translate3d for sub-pixel precision and GPU acceleration
        cursor.style.transform = `translate3d(${e.clientX - 10}px, ${e.clientY - 10}px, 0)`;
      }
    };
    
    const handleMouseOver = (e) => {
      if (!e.target) return;
      const target = e.target;
      
      // If hovering over interactive elements, expand cursor
      if(target.tagName?.toLowerCase() === 'button' || 
         target.tagName?.toLowerCase() === 'a' || 
         target.tagName?.toLowerCase() === 'select' || 
         target.tagName?.toLowerCase() === 'input' || 
         target.closest('button')) {
        cursor?.classList.add('hovering');
      }
    };

    const handleMouseOut = () => {
        cursor?.classList.remove('hovering');
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.head.removeChild(style);
      document.body.style.cursor = 'auto';
    }
  }, [])

  return createPortal(
    <div id="custom-cursor" className="custom-cursor"></div>,
    document.body
  )
}

export default CustomCursor
