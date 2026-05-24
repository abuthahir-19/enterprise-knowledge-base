import React from 'react'
import { Link } from 'react-router-dom'
import { Eye, Star, Calendar, User, FolderOpen } from 'lucide-react'
import ArticleStatusBadge from './ArticleStatusBadge.jsx'

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={star <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{value ? value.toFixed(1) : '0.0'}</span>
    </div>
  )
}

export default function ArticleCard({ article, showStatus = false }) {
  const {
    id,
    title,
    description,
    author,
    category,
    tags = [],
    status,
    view_count = 0,
    average_rating = 0,
    created_at,
  } = article

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Link
      to={`/articles/${id}`}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug flex-1 min-w-0">
          {title}
        </h3>
        {showStatus && <ArticleStatusBadge status={status} />}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id || tag}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium"
            >
              {tag.name || tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-400">+{tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 pt-3 mt-auto">
        <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {author && (
              <span className="flex items-center gap-1 truncate">
                <User size={12} className="shrink-0" />
                <span className="truncate">{author.full_name || author.name || 'Unknown'}</span>
              </span>
            )}
            {category && (
              <span className="flex items-center gap-1 truncate">
                <FolderOpen size={12} className="shrink-0" />
                <span className="truncate">{category.name}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {view_count}
            </span>
            <StarRating value={average_rating} />
          </div>
        </div>
        {created_at && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
            <Calendar size={11} />
            {formatDate(created_at)}
          </div>
        )}
      </div>
    </Link>
  )
}
