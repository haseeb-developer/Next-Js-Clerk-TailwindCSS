# Quick Categories Integration Guide

## Step 1: Run Database Migration

First, go to your Supabase dashboard and run this SQL:

```sql
-- Execute the content of create-categories-table.sql in your Supabase SQL editor
```

Or copy the SQL from `create-categories-table.sql` and run it in Supabase.

## Step 2: Add Categories Section to Snippets Page

I've already added all the necessary code to `SnippetsContent.tsx`:
- ✅ Category state variables
- ✅ Category CRUD functions  
- ✅ Category filtering logic
- ✅ Imported CategoryCard and CreateCategoryModal components

## Step 3: Add the UI Section

You need to add the categories UI section to your snippets page. Here's where to add it:

**Add this section AFTER the "My Folders" section in your SnippetsContent.tsx:**

```tsx
{/* Categories Section */}
<div className="mb-8">
  <div 
    role="button"
    onClick={() => setShowCategoriesSection(!showCategoriesSection)}
    className="flex items-center justify-between p-6 bg-gray-800/30 rounded-2xl border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-all duration-200"
  >
    <div>
      <h3 className="text-xl font-bold text-white mb-1">My Categories</h3>
      <p className="text-gray-400 text-sm">Organize snippets by category</p>
    </div>
    <div className="flex items-center gap-3">
      {selectedCategoryId && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedCategoryId(null)
          }}
          className="px-4 py-2 text-sm font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
        >
          Clear Filter
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowCreateCategory(true)
        }}
        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg transition-all duration-200 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5"/>
          </svg>
          New Category
        </div>
      </button>
      <button
        className={`p-2 rounded-lg transition-all duration-200 ${
          showCategoriesSection ? 'bg-gray-700 rotate-180' : 'bg-gray-700/50'
        }`}
      >
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
    </div>
  </div>

  {showCategoriesSection && (
    <div className="mt-6 space-y-6">
      {/* All Categories Card */}
      <div 
        className={`cursor-pointer transition-all duration-300 rounded-2xl border-2 p-6 ${
          selectedCategoryId === null 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
        }`}
        onClick={() => setSelectedCategoryId(null)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            selectedCategoryId === null ? 'bg-purple-500/20' : 'bg-gray-700/50'
          }`}>
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Search Categories */}
      {categories.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearchTerm}
            onChange={(e) => setCategorySearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      )}

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              snippetCount={categorySnippetCounts[category.id] || 0}
              isSelected={selectedCategoryId === category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              onEdit={() => setEditingCategory(category)}
              onDelete={() => handleDeleteCategory(category.id)}
            />
          ))}
        </div>
      ) : categorySearchTerm ? (
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
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-6">Create your first category to organize your snippets.</p>
          <button
            onClick={() => setShowCreateCategory(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Create Category
          </button>
        </div>
      )}
    </div>
  )}
</div>

{/* Category Modals */}
<CreateCategoryModal
  isOpen={showCreateCategory}
  onClose={() => setShowCreateCategory(false)}
  onSubmit={(data) => handleCreateCategory(data as CreateCategoryData)}
/>

<CreateCategoryModal
  isOpen={!!editingCategory}
  onClose={() => setEditingCategory(null)}
  onSubmit={(data) => handleUpdateCategory(data as CreateCategoryData)}
  editingCategory={editingCategory}
/>
```

## Step 4: Add Category Selection to Snippet Form

In your snippet creation/edit form, add a category dropdown:

```tsx
{/* Add this after the folder selection in your form */}
<div>
  <label className="block text-sm font-medium text-white mb-2">Category</label>
  <select
    value={formData.category_id || ''}
    onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
    className="w-full px-4 py-3 bg-gray-800/90 border border-gray-600/60 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50"
  >
    <option value="">No Category</option>
    {categories.map(cat => (
      <option key={cat.id} value={cat.id}>{cat.name}</option>
    ))}
  </select>
</div>
```

## That's It!

After adding these UI sections, your categories feature will be fully functional with:
- ✅ Beautiful category cards with gradients
- ✅ Create, edit, delete categories
- ✅ Filter snippets by category
- ✅ Search categories
- ✅ Assign snippets to categories
- ✅ Category-based snippet counting

The backend logic is already integrated!
