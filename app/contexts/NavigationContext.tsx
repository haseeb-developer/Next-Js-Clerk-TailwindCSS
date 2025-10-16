'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface NavigationContextType {
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (hasUnsaved: boolean) => void
  showUnsavedAlert: boolean
  setShowUnsavedAlert: (show: boolean) => void
  pendingNavigation: (() => void) | null
  setPendingNavigation: (navigation: (() => void) | null) => void
  protectedNavigate: (url: string) => void
  protectedBack: () => void
  handleUnsavedAlertConfirm: () => void
  handleUnsavedAlertCancel: () => void
  handleAlertSave: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

  const protectedNavigate = useCallback((url: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => () => router.push(url))
      setShowUnsavedAlert(true)
    } else {
      router.push(url)
    }
  }, [hasUnsavedChanges, router])

  const protectedBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => () => router.back())
      setShowUnsavedAlert(true)
    } else {
      router.back()
    }
  }, [hasUnsavedChanges, router])

  const handleUnsavedAlertConfirm = useCallback(() => {
    setShowUnsavedAlert(false)
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
  }, [pendingNavigation])

  const handleUnsavedAlertCancel = useCallback(() => {
    setShowUnsavedAlert(false)
    setPendingNavigation(null)
  }, [])

  const handleAlertSave = useCallback(() => {
    setHasUnsavedChanges(false)
  }, [])

  return (
    <NavigationContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        showUnsavedAlert,
        setShowUnsavedAlert,
        pendingNavigation,
        setPendingNavigation,
        protectedNavigate,
        protectedBack,
        handleUnsavedAlertConfirm,
        handleUnsavedAlertCancel,
        handleAlertSave,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
