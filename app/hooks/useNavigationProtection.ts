'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface UseNavigationProtectionProps {
  hasUnsavedChanges: boolean
  onNavigationAttempt: (navigationFunction: () => void) => void
}

export function useNavigationProtection({ 
  hasUnsavedChanges, 
  onNavigationAttempt 
}: UseNavigationProtectionProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Protect against browser back/forward navigation
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  // Create protected navigation function
  const protectedNavigate = useCallback((url: string) => {
    if (hasUnsavedChanges) {
      onNavigationAttempt(() => {
        router.push(url)
      })
    } else {
      router.push(url)
    }
  }, [hasUnsavedChanges, onNavigationAttempt, router])

  // Create protected back navigation function
  const protectedBack = useCallback(() => {
    if (hasUnsavedChanges) {
      onNavigationAttempt(() => {
        router.back()
      })
    } else {
      router.back()
    }
  }, [hasUnsavedChanges, onNavigationAttempt, router])

  return {
    protectedNavigate,
    protectedBack,
    currentPath: pathname
  }
}
