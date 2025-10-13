'use client'

import { useEffect } from 'react'

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      // Store current scroll position
      const scrollY = window.scrollY
      
      // Add scroll lock class
      document.body.classList.add('scroll-locked')
      
      // Set top position to maintain scroll position
      document.body.style.top = `-${scrollY}px`
      
      return () => {
        // Remove scroll lock class
        document.body.classList.remove('scroll-locked')
        
        // Restore scroll position
        document.body.style.top = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isLocked])
}
