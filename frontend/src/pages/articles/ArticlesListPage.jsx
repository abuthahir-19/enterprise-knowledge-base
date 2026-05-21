import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlusCircle, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import articleService from '../../services/articleService.js'
import ArticleCard from '../../components/articles/ArticleCard.jsx'
import ArticleFilters from '../../components/articles/ArticleFilters.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

const PAGE_SIZE = 12

export default function ArticlesListPage() {
  const { hasRole } = useAuth()
  const isAuthorOrAdmin = hasRole(['author', 'admin'])

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    category_id: '',
    tag_id: '',
    status: '',
    sort: '',
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', filters, page],
    queryFn: () =>
      articleService.getArticles({
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
  })

  const articles = Array.isArray(data) ? data : data?.items || data?.articles || []
  const total = data?.total || articles.length

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" />
            Knowledge Articles
          </h1>
          <p className="text-gray-500 text-sm mt-1">Browse and discover knowledge articles</p>
        </div>
        {isAuthorOrAdmin && (
          <Link
            to="/articles/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <PlusCircle size={16} />
            Create Article
          </Link>
        )}
      </div>

      {/* Filters */}
      <ArticleFilters filters={filters} onChange={handleFilterChange} />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-56 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No articles found</h3>
          <p className="text-gray-400 text-sm">
            Try adjusting your filters or{' '}
            {isAuthorOrAdmin && (
              <Link to="/articles/create" className="text-blue-600 hover:underline">
                create the first article
              </Link>
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} showStatus />
            ))}
          </div>
          <Pagination
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
