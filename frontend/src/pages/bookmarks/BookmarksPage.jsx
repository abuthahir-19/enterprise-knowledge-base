import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import collaborationService from '../../services/collaborationService.js'
import ArticleCard from '../../components/articles/ArticleCard.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function BookmarksPage() {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: collaborationService.getBookmarks,
  })

  // Support both array of articles and array of bookmark objects
  const articles = data.map((item) => item.article || item).filter(Boolean)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bookmark size={24} className="text-blue-600" />
          Bookmarks
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Articles you've saved for later
          {articles.length > 0 && (
            <span className="ml-1">({articles.length})</span>
          )}
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner centered />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark size={28} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No bookmarks yet</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            When you bookmark articles, they'll appear here so you can quickly find them later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
