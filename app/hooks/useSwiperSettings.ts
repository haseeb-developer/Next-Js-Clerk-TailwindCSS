'use client'

import { useState, useEffect } from 'react'

interface SwiperSettings {
  foldersSwiper: boolean
  categoriesSwiper: boolean
  safePasswordsFoldersSwiper: boolean
  safePasswordsCategoriesSwiper: boolean
}

const defaultSettings: SwiperSettings = {
  foldersSwiper: false,
  categoriesSwiper: false,
  safePasswordsFoldersSwiper: false,
  safePasswordsCategoriesSwiper: false
}

export function useSwiperSettings() {
  const [settings, setSettings] = useState<SwiperSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('swiper-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error('Error loading swiper settings:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const updateSettings = (newSettings: Partial<SwiperSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    
    try {
      localStorage.setItem('swiper-settings', JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving swiper settings:', error)
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    try {
      localStorage.removeItem('swiper-settings')
    } catch (error) {
      console.error('Error resetting swiper settings:', error)
    }
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoaded
  }
}
