'use client'

import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface AlertModalProps {
  isOpen: boolean
  title: string
  message: string
  variant?: 'error' | 'info'
  onClose: () => void
}

export function AlertModal({ isOpen, title, message, variant = 'info', onClose }: AlertModalProps) {
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen)

  if (!isOpen) return null
  const accent = variant === 'error' ? 'text-red-400' : 'text-blue-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1px solid #0f172a'
        }}
        className="w-full max-w-md rounded-3xl p-6"
      >
        <h3 className={`text-lg font-bold mb-2 ${accent}`}>{title}</h3>
        <p className="text-gray-300 mb-5">{message}</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="cursor-pointer px-5 py-2 rounded-xl bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">OK</button>
        </div>
      </div>
    </div>
  )
}


