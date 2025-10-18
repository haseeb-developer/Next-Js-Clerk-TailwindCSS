'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Category, CreateCategoryData, UpdateCategoryData } from '../../lib/supabase'
import CategoryCard from './CategoryCard'
import CreateCategoryModal from './CreateCategoryModal'
import { AlertModal } from './AlertModal'

interface CategoriesContentProps {
  user: { id: string } | null
  onCategorySelect?: (categoryId: string | null) => void
  selectedCategoryId?: string | null
}

export default function CategoriesContent({ 
  user, 
  onCategorySelect, 
  selectedCategoryId = null 
}: CategoriesContentProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categorySnippetCounts, setCategorySnippetCounts] = useState<{ [key: string]: number }>({})

  const fetchCategories = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })

      if (categoriesError) throw categoriesError

      setCategories(categoriesData || [])

      // Fetch snippet counts for each category
      const { data: snippetCounts, error: countError } = await supabase
        .from('snippets')
        .select('category_id')
        .eq('user_id', user.id)

      if (countError) throw countError

      const counts: { [key: string]: number } = {}
      snippetCounts?.forEach(snippet => {
        const categoryId = snippet.category_id || 'uncategorized'
        counts[categoryId] = (counts[categoryId] || 0) + 1
      })

      setCategorySnippetCounts(counts)
      
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchCategories()
    }
  }, [user?.id, fetchCategories])

  const handleCreateCategory = async (data: CreateCategoryData) => {
    if (!user?.id) return

    try {
      // Check for duplicate names
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', user.id)
        .ilike('name', data.name!)

      if (existingCategories && existingCategories.length > 0) {
        setAlertMessage(`A category named "${data.name}" already exists. Please choose a different name.`)
        setShowAlert(true)
        return
      }

      // Get the next sort order
      const { data: lastCategory } = await supabase
        .from('categories')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextSortOrder = lastCategory?.[0]?.sort_order ? lastCategory[0].sort_order + 1 : 0

      const { error } = await supabase
        .from('categories')
        .insert([{
          ...data,
          user_id: user.id,
          sort_order: nextSortOrder
        }])

      if (error) throw error

      await fetchCategories()
      
    } catch (error) {
      console.error('Error creating category:', error)
      setAlertMessage('Failed to create category. Please try again.')
      setShowAlert(true)
    }
  }

  const handleUpdateCategory = async (data: UpdateCategoryData) => {
    if (!editingCategory || !user?.id) return

    try {
      // Check for duplicate names (excluding current category)
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', user.id)
        .neq('id', editingCategory.id)
        .ilike('name', data.name!)

      if (existingCategories && existingCategories.length > 0) {
        setAlertMessage(`A category named "${data.name}" already exists. Please choose a different name.`)
        setShowAlert(true)
        return
      }

      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', editingCategory.id)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchCategories()
      setEditingCategory(null)
      
    } catch (error) {
      console.error('Error updating category:', error)
      setAlertMessage('Failed to update category. Please try again.')
      setShowAlert(true)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user?.id) return

    try {
      // First, move all snippets in this category to uncategorized
      await supabase
        .from('snippets')
        .update({ category_id: null })
        .eq('category_id', categoryId)
        .eq('user_id', user.id)

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchCategories()
      
      // If the deleted category was selected, select "All Categories"
      if (selectedCategoryId === categoryId) {
        onCategorySelect?.(null)
      }
      
    } catch (error) {
      console.error('Error deleting category:', error)
      setAlertMessage('Failed to delete category. Please try again.')
      setShowAlert(true)
    }
  }

  const handleCategorySelect = (categoryId: string | null) => {
    onCategorySelect?.(categoryId)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Categories</h2>
          <p className="text-gray-400 mt-1">Organize your snippets with custom categories</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5"/>
            </svg>
            New Category
          </div>
        </button>
      </div>

      {/* Search */}
      {categories.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      )}

      {/* All Categories Card */}
      <div 
        className={`cursor-pointer transition-all duration-300 rounded-2xl border-2 p-6 ${
          selectedCategoryId === null 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
        }`}
        onClick={() => handleCategorySelect(null)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            selectedCategoryId === null ? 'bg-blue-500/20' : 'bg-gray-700/50'
          }`}>
            <svg className="w-6 h-6 cursor-pointer text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">All Categories</h3>
            <p className="text-sm text-gray-400">View snippets from all categories</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {Object.values(categorySnippetCounts).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-xs text-gray-400">total snippets</div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              snippetCount={categorySnippetCounts[category.id] || 0}
              isSelected={selectedCategoryId === category.id}
              onClick={() => handleCategorySelect(category.id)}
              onEdit={() => setEditingCategory(category)}
              onDelete={() => handleDeleteCategory(category.id)}
            />
          ))}
        </div>
      ) : searchTerm ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories found</h3>
          <p className="text-gray-500">No categories match your search term.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-6">Create your first category to organize your snippets.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            Create Category
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateCategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => handleCreateCategory(data as CreateCategoryData)}
      />

      <CreateCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSubmit={(data) => handleUpdateCategory(data as UpdateCategoryData)}
        editingCategory={editingCategory}
      />

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Category Error"
        message={alertMessage}
      />
    </div>
  )
}
