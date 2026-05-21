import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal } from 'lucide-react'
import searchService from '../../services/searchService.js'
import categoryService from '../../services/categoryService.js'
import tagService from '../../services/tagService.js'
import ArticleCard from '../../components/articles/ArticleCard.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'

const PAGE_SIZE = 12

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    category_id: searchParams.get('category_id') || '',
    tag_id: searchParams.get('tag_id') || '',
    sort: searchParams.get('sort') || '',
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getTags,
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query, filters, page],
    queryFn: () =>
      searchService.search({
        q: query,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    enabled: true,
  })

  const results = Array.isArray(data) ? data : data?.items || data?.results || []
  const total = data?.total || results.length

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(inputValue)
    setPage(1)
    const params = {}
    if (inputValue) params.q = inputValue
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.tag_id) params.tag_id = filters.tag_id
    if (filters.sort) params.sort = filters.sort
    setSearchParams(params)
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Articles</h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search by title, content, tags..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-3">
        <SlidersHorizontal size={16} className="text-gray-400" />
        <span className="text-sm text-gray-500 font-medium">Filter:</span>

        <select
          value={filters.category_id}
          onChange={(e) => handleFilterChange('category_id', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filters.tag_id}
          onChange={(e) => handleFilterChange('tag_id', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sort: Latest</option>
          <option value="popular">Sort: Most Viewed</option>
          <option value="rating">Sort: Highest Rated</option>
        </select>
      </div>

      {/* Results count */}
      {(query || Object.values(filters).some(Boolean)) && (
        <div className="mb-4 text-sm text-gray-500">
          {isFetching ? (
            'Searching...'
          ) : (
            <>
              {total > 0 ? (
                <span>
                  Found <strong className="text-gray-900">{total}</strong> result{total !== 1 ? 's' : ''}
                  {query && <> for <strong className="text-gray-900">"{query}"</strong></>}
                </span>
              ) : (
                <span>No results found{query && <> for <strong className="text-gray-900">"{query}"</strong></>}</span>
              )}
            </>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {query ? 'No articles found' : 'Start searching'}
          </h3>
          <p className="text-gray-400 text-sm">
            {query
              ? 'Try different keywords or remove filters'
              : 'Enter a search term above to find articles'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
