import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Edit, Trash2, Send, Eye, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import articleService from '../../services/articleService.js'
import ArticleStatusBadge from '../../components/articles/ArticleStatusBadge.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function MyArticlesPage() {
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState(null)

  const { data: articles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['my-articles'],
    queryFn: articleService.getMyArticles,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => articleService.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] })
      toast.success('Article deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete'),
  })

  const submitMutation = useMutation({
    mutationFn: (id) => articleService.submitForApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] })
      toast.success('Submitted for review')
    },
    onError: () => toast.error('Failed to submit'),
  })

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Articles</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your knowledge base articles</p>
        </div>
        <Link
          to="/articles/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          New Article
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner centered />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No articles yet</h3>
          <p className="text-gray-400 text-sm mb-6">Start writing your first knowledge article</p>
          <Link
            to="/articles/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <PlusCircle size={16} />
            Create Article
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Created</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      to={`/articles/${article.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                    >
                      {article.title}
                    </Link>
                    {article.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{article.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <ArticleStatusBadge status={article.status} />
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-gray-500">{article.category?.name || '—'}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-500">{formatDate(article.created_at)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/articles/${article.id}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/articles/${article.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </Link>
                      {article.status === 'draft' && (
                        <button
                          onClick={() => submitMutation.mutate(article.id)}
                          disabled={submitMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Submit for review"
                        >
                          <Send size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(article.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
