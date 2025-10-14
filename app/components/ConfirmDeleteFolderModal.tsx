'use client'

import { useState, useEffect } from 'react'
import { Folder } from '../../lib/supabase'

interface ConfirmDeleteFolderModalProps {
  isOpen: boolean
  folder: Folder | null
  onClose: () => void
  onConfirm: (folderId: string) => void
}

export function ConfirmDeleteFolderModal({ isOpen, folder, onClose, onConfirm }: ConfirmDeleteFolderModalProps) {
  const [value, setValue] = useState('')
  const requiredPhrase = 'CONFIRM DELETE'

  useEffect(() => {
    if (isOpen) setValue('')
  }, [isOpen])

  if (!isOpen || !folder) return null

  const canDelete = value.trim() === requiredPhrase

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1px solid #0f172a'
        }}
        className="w-full max-w-xl rounded-3xl p-6"
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: folder.color }}
          >
            {/* icon */}
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm text-red-400 font-semibold">Type &quot;{requiredPhrase}&quot; to delete your folder.</span>
            </div>
            <h3 className="text-lg font-bold text-white truncate">{folder.name}</h3>
            {folder.description && (
              <p className="text-gray-400 text-sm mt-0.5 line-clamp-2">{folder.description}</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-white mb-2">Confirmation</label>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={requiredPhrase}
            className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-300/60"
          />
          <p className="text-xs text-gray-400 mt-2">This will remove the folder. Snippets inside will remain at root.</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2 rounded-xl bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!canDelete}
            onClick={() => onConfirm(folder.id)}
            className={`px-5 py-2 rounded-xl text-white transition-colors ${canDelete ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500/50 cursor-not-allowed'}`}
          >
            Delete Folder
          </button>
        </div>
      </div>
    </div>
  )
}


