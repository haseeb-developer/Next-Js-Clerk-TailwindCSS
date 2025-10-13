'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  snippetTitle: string
  isPermanent?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  snippetTitle,
  isPermanent = false
}: DeleteConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              border: '1px solid #0f172a'
            }} 
            className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isPermanent ? 'Permanent Delete' : 'Move to Recycle Bin'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isPermanent ? 'This action cannot be undone' : 'You can restore it later'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            {isPermanent 
              ? `Are you sure you want to permanently delete "${snippetTitle}"? This action cannot be undone and the snippet will be lost forever.`
              : `Are you sure you want to move "${snippetTitle}" to the recycle bin? You can restore it later within 30 days.`
            }
          </p>
          
          {!isPermanent && (
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <p className="text-blue-300 text-sm font-medium mb-1">Recycle Bin Info</p>
                  <p className="text-blue-200 text-xs">
                    Deleted snippets are kept for 30 days. You can restore them anytime during this period.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-all duration-300 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 px-6 py-3 text-white rounded-xl transition-all duration-300 font-semibold cursor-pointer ${
              isPermanent 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isPermanent ? 'Delete Forever' : 'Move to Recycle Bin'}
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
