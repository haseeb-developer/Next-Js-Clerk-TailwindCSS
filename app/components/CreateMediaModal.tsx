'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useBodyScrollLock } from '@/app/hooks/useBodyScrollLock'

interface CreateMediaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  folderId?: string | null
}

export default function CreateMediaModal({
  isOpen,
  onClose,
  onSuccess,
  folderId
}: CreateMediaModalProps) {
  const { user } = useUser()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [fileTitles, setFileTitles] = useState<{ [key: string]: string }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' | null }>({})

  useBodyScrollLock(isOpen)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Limit to 10 files maximum
      if (newFiles.length > 10) {
        toast.error('You can only upload a maximum of 10 files at once')
        const limitedFiles = newFiles.slice(0, 10)
        e.target.value = '' // Reset the input
        setFiles(limitedFiles)
      } else {
        setFiles(newFiles)
      }
      
      // Initialize titles for new files
      const newTitles: { [key: string]: string } = {}
      const finalFiles = newFiles.length > 10 ? newFiles.slice(0, 10) : newFiles
      finalFiles.forEach(file => {
        const fileName = file.name.split('.')[0] // Remove extension
        newTitles[file.name] = fileName
      })
      setFileTitles(newTitles)
      
      // Reset status
      setUploadStatus({})
      setUploadProgress({})
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    setUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileKey = file.name

        // Mark as uploading
        setUploadStatus(prev => ({ ...prev, [fileKey]: 'uploading' }))
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }))
          throw uploadError
        }

        // Mark as 100% uploaded
        setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        // Create media file record
        const fileType = file.type.startsWith('image/') ? 'image' : 'video'
        const fileSize = file.size
        const mimeType = file.type
        const customTitle = fileTitles[fileKey] || file.name.split('.')[0]

        // Check for duplicate name in the current folder
        const { data: existingFiles } = await supabase
          .from('media_files')
          .select('file_name')
          .eq('user_id', user.id)
          .eq('file_name', customTitle)
          .eq('media_folder_id', folderId || null)
          .is('deleted_at', null)

        if (existingFiles && existingFiles.length > 0) {
          setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }))
          setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))
          toast.error(`A file named "${customTitle}" already exists in this folder`)
          continue // Skip this file
        }

        const { error: insertError } = await supabase
          .from('media_files')
          .insert({
            user_id: user.id,
            file_name: customTitle, // Use custom title as file_name
            file_type: fileType,
            file_url: publicUrl,
            file_size: fileSize,
            mime_type: mimeType,
            media_folder_id: folderId || null,
          })

        if (insertError) {
          setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }))
          throw insertError
        }

        // Mark as successful
        setUploadStatus(prev => ({ ...prev, [fileKey]: 'success' }))
      }

      toast.success(`Successfully uploaded ${files.length} file(s)`)
      setTimeout(() => {
        setFiles([])
        setFileTitles({})
        setUploadStatus({})
        setUploadProgress({})
        onSuccess()
      }, 1000)
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#0F1B2E] border border-gray-700 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Upload Media</h2>
                {files.length > 0 && (
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-sm text-gray-400">
                      {files.length} / 10 files
                    </p>
                    <span className="text-gray-600">•</span>
                    <p className="text-sm text-gray-400">
                      Total: {(files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto flex-1 pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Files
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="w-full bg-[#111B32] border border-gray-700 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {files.length > 0 && (
                  <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {files.map((file, index) => {
                      const fileKey = file.name
                      const status = uploadStatus[fileKey]
                      const progress = uploadProgress[fileKey] || 0
                      
                      return (
                        <div key={index} className="bg-[#111B32] border border-gray-700 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={fileTitles[fileKey] || ''}
                                onChange={(e) => setFileTitles(prev => ({ ...prev, [fileKey]: e.target.value }))}
                                placeholder="Enter title..."
                                className="w-full bg-[#0a111a] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <p className="text-xs text-gray-400 mt-1">{file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            {status === 'success' && (
                              <svg className="w-5 h-5 text-green-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            {status === 'error' && (
                              <svg className="w-5 h-5 text-red-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                            {status === 'uploading' && (
                              <div className="animate-spin ml-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {status === 'uploading' && (
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-700 mt-4 flex-shrink-0">
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all cursor-pointer font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
