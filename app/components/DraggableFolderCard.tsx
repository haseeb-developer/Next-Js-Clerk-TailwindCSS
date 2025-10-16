'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Folder } from '@/lib/supabase'
import { FolderCard } from './FolderCard'

interface DraggableFolderCardProps {
  folder: Folder
  onDelete: (folder: Folder) => void
  onEdit: (folder: Folder) => void
  onSelect: (folderId: string) => void
  snippetCount: number
}

export function DraggableFolderCard({ 
  folder, 
  onDelete, 
  onEdit, 
  onSelect,
  snippetCount 
}: DraggableFolderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? 'scale-110 shadow-2xl rotate-2 cursor-grabbing' : 'hover:scale-105 cursor-grab'} transition-all duration-200 touch-none`}
    >
      <FolderCard
        folder={folder}
        onDelete={onDelete}
        onEdit={onEdit}
        onSelect={onSelect}
        snippetCount={snippetCount}
      />
    </div>
  )
}
