import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, FileText, CheckSquare, Users, FolderOpen, PlusCircle, Eye, Star, TrendingUp
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import analyticsService from '../../services/analyticsService.js'
import MetricsCard from '../../components/analytics/MetricsCard.jsx'
import ArticleCard from '../../components/articles/ArticleCard.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import ArticleStatusBadge from '../../components/articles/ArticleStatusBadge.jsx'

export default function DashboardPage() {
  const { user, hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const isAuthorOrAdmin = hasRole(['author', 'admin'])
  const isReviewerOrAdmin = hasRole(['reviewer', 'admin'])

  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: analyticsService.getDashboardMetrics,
  })

  const { data: recentArticles = [], isLoading: recentLoading } = useQuery({
    queryKey: ['recent-articles-dashboard'],
    queryFn: analyticsService.getRecentArticles,
  })

  const { data: popularArticles = [], isLoading: popularLoading } = useQuery({
    queryKey: ['popular-articles-dashboard'],
    queryFn: analyticsService.getPopularArticles,
  })

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening in your knowledge base</p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthorOrAdmin && (
            <Link
              to="/articles/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircle size={16} />
              Create Article
            </Link>
          )}
          {isReviewerOrAdmin && (
            <Link
              to="/approvals"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <CheckSquare size={16} />
              Review Queue
              {metrics?.pending_approvals > 0 && (
                <span className="bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {metrics.pending_approvals}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      {metricsError && (
        <ErrorMessage message={metricsError} onRetry={refetch} />
      )}

      {/* Metrics cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Articles"
            value={metrics.total_articles}
            icon={BookOpen}
            color="blue"
          />
          <MetricsCard
            title="Published"
            value={metrics.published_articles}
            icon={FileText}
            color="green"
          />
          <MetricsCard
            title="Pending Review"
            value={metrics.pending_approvals}
            icon={CheckSquare}
            color="yellow"
          />
          {isAdmin ? (
            <MetricsCard
              title="Total Users"
              value={metrics.total_users}
              icon={Users}
              color="purple"
            />
          ) : (
            <MetricsCard
              title="Categories"
              value={metrics.total_categories}
              icon={FolderOpen}
              color="teal"
            />
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Recent Articles
            </h2>
            <Link to="/articles" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLoading ? (
              <div className="p-6"><LoadingSpinner centered /></div>
            ) : recentArticles.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No articles yet</div>
            ) : (
              recentArticles.slice(0, 6).map((article) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.id}`}
                  className="flex items-start justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {article.author?.full_name} · {new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <ArticleStatusBadge status={article.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" />
              Most Viewed
            </h2>
            <Link to="/search?sort=popular" className="text-sm text-blue-600 hover:underline">
              Explore
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {popularLoading ? (
              <div className="p-6"><LoadingSpinner centered /></div>
            ) : popularArticles.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No data yet</div>
            ) : (
              popularArticles.slice(0, 6).map((article, idx) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl font-black text-gray-200 w-6 text-center leading-none">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye size={11} /> {article.view_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-yellow-400" />
                        {article.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
