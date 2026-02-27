import React, { useEffect } from 'react'

const CustomCursor = () => {
  useEffect(() => {
    const cursor = document.getElementById('custom-cursor');
    
    // Hide default cursor early
    const root = document.getElementById('root');
    if(root) root.style.cursor = 'none';

    const moveCursor = (e) => {
      if(cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      }
    };
    
    const handleMouseOver = (e) => {
      // If hovering over interactive elements, expand cursor
      if(e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'a' || e.target.closest('button') || e.target.tagName.toLowerCase() === 'input') {
        cursor?.classList.add('hovering');
      }
    };

    const handleMouseOut = () => {
        cursor?.classList.remove('hovering');
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if(root) root.style.cursor = 'auto';
    }
  }, [])

  return (
    <div id="custom-cursor" className="custom-cursor"></div>
  )
}

export default CustomCursor
