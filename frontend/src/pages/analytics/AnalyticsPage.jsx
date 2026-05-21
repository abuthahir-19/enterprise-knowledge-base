import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts'
import {
  BookOpen, Users, FolderOpen, CheckSquare, Eye, TrendingUp, Search
} from 'lucide-react'
import analyticsService from '../../services/analyticsService.js'
import MetricsCard from '../../components/analytics/MetricsCard.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export default function AnalyticsPage() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: analyticsService.getDashboardMetrics,
  })

  const { data: popular = [], isLoading: popularLoading } = useQuery({
    queryKey: ['popular-articles'],
    queryFn: analyticsService.getPopularArticles,
  })

  const { data: categoryStats = [], isLoading: catLoading } = useQuery({
    queryKey: ['category-stats'],
    queryFn: analyticsService.getCategoryStats,
  })

  const { data: searchTrends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['search-trends'],
    queryFn: analyticsService.getSearchTrends,
  })

  if (metricsLoading) return <LoadingSpinner centered />
  if (metricsError) return <ErrorMessage message={metricsError} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={24} className="text-blue-600" />
          Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Monitor knowledge base performance and usage</p>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Articles"
            value={metrics.total_articles}
            icon={BookOpen}
            color="blue"
          />
          <MetricsCard
            title="Published Articles"
            value={metrics.published_articles}
            icon={Eye}
            color="green"
          />
          <MetricsCard
            title="Pending Review"
            value={metrics.pending_approvals}
            icon={CheckSquare}
            color="yellow"
          />
          <MetricsCard
            title="Total Users"
            value={metrics.total_users}
            icon={Users}
            color="purple"
          />
          {metrics.total_categories !== undefined && (
            <MetricsCard
              title="Categories"
              value={metrics.total_categories}
              icon={FolderOpen}
              color="teal"
            />
          )}
          {metrics.total_views !== undefined && (
            <MetricsCard
              title="Total Views"
              value={metrics.total_views}
              icon={Eye}
              color="blue"
            />
          )}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderOpen size={18} className="text-blue-600" />
            Articles by Category
          </h2>
          {catLoading ? (
            <LoadingSpinner centered />
          ) : categoryStats.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryStats} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="article_count" name="Articles" radius={[4, 4, 0, 0]}>
                  {categoryStats.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Most Viewed Articles */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye size={18} className="text-green-600" />
            Top 10 Most Viewed Articles
          </h2>
          {popularLoading ? (
            <LoadingSpinner centered />
          ) : popular.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={popular.slice(0, 10).map((a) => ({ name: a.title?.slice(0, 30) + '...', views: a.view_count || 0 }))}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="views" name="Views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Trends */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <Search size={18} className="text-purple-600" />
            <h2 className="font-semibold text-gray-900">Top Search Terms</h2>
          </div>
          {trendsLoading ? (
            <LoadingSpinner centered />
          ) : searchTrends.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No search data</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-2.5">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-2.5">Search Term</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-2.5">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {searchTrends.slice(0, 10).map((term, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-900">{term.query || term.term}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm text-gray-600 font-medium">{term.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Popular Articles Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <TrendingUp size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-900">Most Viewed Articles</h2>
          </div>
          {popularLoading ? (
            <LoadingSpinner centered />
          ) : popular.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No data</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-2.5">Article</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-2.5">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {popular.slice(0, 8).map((article, idx) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-300 w-4">{idx + 1}</span>
                        <span className="text-sm text-gray-900 line-clamp-1">{article.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-sm text-gray-600">
                        <Eye size={13} className="text-blue-400" />
                        {article.view_count || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
