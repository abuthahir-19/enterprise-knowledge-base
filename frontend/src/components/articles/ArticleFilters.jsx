import React from 'react'
import { Filter, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import categoryService from '../../services/categoryService.js'
import tagService from '../../services/tagService.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ArticleFilters({ filters, onChange }) {
  const { hasRole } = useAuth()
  const isAdminOrReviewer = hasRole(['admin', 'reviewer'])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getTags,
  })

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ]

  const sortOptions = [
    { value: '', label: 'Sort: Latest' },
    { value: 'popular', label: 'Sort: Popular' },
    { value: 'title', label: 'Sort: Title A-Z' },
  ]

  const hasActiveFilters =
    filters.category_id || filters.tag_id || filters.status || filters.sort

  const handleClear = () => {
    onChange({ category_id: '', tag_id: '', status: '', sort: '' })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Filter size={16} />
          <span className="font-medium">Filters</span>
        </div>

        {/* Category */}
        <select
          value={filters.category_id || ''}
          onChange={(e) => onChange({ ...filters, category_id: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Tag */}
        <select
          value={filters.tag_id || ''}
          onChange={(e) => onChange({ ...filters, tag_id: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        {/* Status — admin/reviewer only */}
        {isAdminOrReviewer && (
          <select
            value={filters.status || ''}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={filters.sort || ''}
          onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
