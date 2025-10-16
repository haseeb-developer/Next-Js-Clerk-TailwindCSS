'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Category } from '@/lib/supabase'
import CategoryCard from './CategoryCard'

interface DraggableCategoryCardProps {
  category: Category
  onDelete: (category: Category) => void
  onEdit: (category: Category) => void
  snippetCount: number
}

export function DraggableCategoryCard({ 
  category, 
  onDelete, 
  onEdit, 
  snippetCount 
}: DraggableCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing !important' : 'grab !important',
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? 'scale-110 shadow-2xl rotate-2' : ''} transition-all duration-200 touch-none cursor-grab`}
    >
      <CategoryCard
        category={category}
        onDelete={() => onDelete(category)}
        snippetCount={snippetCount}
      />
    </div>
  )
}
