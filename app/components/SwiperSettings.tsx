'use client'

import { motion } from 'framer-motion'
import { useSwiperSettings } from '../hooks/useSwiperSettings'

export function SwiperSettings() {
  const { settings, updateSettings, isLoaded } = useSwiperSettings()

  const handleToggle = (key: keyof typeof settings) => {
    // Save immediately when toggled
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    }
    updateSettings(newSettings)
  }

  if (!isLoaded) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="border-b border-gray-700/50 pb-4">
        <h3 className="text-xl font-semibold text-white mb-2">Display Settings</h3>
        <p className="text-gray-400 text-sm">
          Customize how folders and categories are displayed in the organize page.
        </p>
      </div>

      {/* Folders Swiper Setting */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white">Folder Swiper</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              When enabled, folders with more than 3 items will be displayed in a beautiful horizontal slider instead of wrapping to multiple rows.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Improves space efficiency</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-3"></div>
              <span>Better mobile experience</span>
            </div>
          </div>
          
          <div className="ml-6">
            <button
              onClick={() => handleToggle('foldersSwiper')}
              className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                settings.foldersSwiper ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  settings.foldersSwiper ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Categories Swiper Setting */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white">Category Swiper</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              When enabled, categories with more than 3 items will be displayed in a beautiful horizontal slider instead of wrapping to multiple rows.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Cleaner layout</span>
              <div className="w-2 h-2 bg-purple-400 rounded-full ml-3"></div>
              <span>Smooth navigation</span>
            </div>
          </div>
          
          <div className="ml-6">
            <button
              onClick={() => handleToggle('categoriesSwiper')}
              className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                settings.categoriesSwiper ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  settings.categoriesSwiper ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Safe Passwords Page Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white">Safe Passwords Folders</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Enable swiper sliders for folders in the Safe Passwords page when there are more than 3 folders.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Better organization</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-3"></div>
              <span>Improved navigation</span>
            </div>
          </div>
          
          <div className="ml-6">
            <button
              onClick={() => handleToggle('safePasswordsFoldersSwiper')}
              className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                settings.safePasswordsFoldersSwiper ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  settings.safePasswordsFoldersSwiper ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Safe Passwords Categories Swiper Setting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white">Safe Passwords Categories</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Enable swiper slider for categories in the Safe Passwords page when there are more than 3 categories.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Cleaner layout</span>
              <div className="w-2 h-2 bg-purple-400 rounded-full ml-3"></div>
              <span>Smooth scrolling</span>
            </div>
          </div>
          
          <div className="ml-6">
            <button
              onClick={() => handleToggle('safePasswordsCategoriesSwiper')}
              className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                settings.safePasswordsCategoriesSwiper ? 'bg-orange-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  settings.safePasswordsCategoriesSwiper ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-gray-700/50"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h4 className="text-sm font-medium text-white">Preview</h4>
        </div>
        <p className="text-gray-400 text-sm">
          {settings.foldersSwiper && settings.categoriesSwiper 
            ? "Both folders and categories will use swiper sliders when they have more than 3 items."
            : settings.foldersSwiper || settings.categoriesSwiper
            ? `${settings.foldersSwiper ? 'Folders' : 'Categories'} will use swiper sliders when they have more than 3 items.`
            : "Folders and categories will display in a traditional grid layout."
          }
        </p>
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <p className="text-gray-400 text-sm">
            <strong>Safe Passwords Page:</strong> {
              settings.safePasswordsFoldersSwiper && settings.safePasswordsCategoriesSwiper
                ? "Both folders and categories will use swiper sliders."
                : settings.safePasswordsFoldersSwiper || settings.safePasswordsCategoriesSwiper
                ? `${settings.safePasswordsFoldersSwiper ? 'Folders' : 'Categories'} will use swiper sliders.`
                : "Swiper sliders are disabled for Safe Passwords page."
            }
          </p>
        </div>
      </motion.div>

    </motion.div>
  )
}
