import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Eye, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import approvalService from '../../services/approvalService.js'
import Modal from '../../components/common/Modal.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function ApprovalQueuePage() {
  const queryClient = useQueryClient()
  const [approveModal, setApproveModal] = useState(null) // article object
  const [rejectModal, setRejectModal] = useState(null)   // article object
  const [approveComment, setApproveComment] = useState('')
  const [rejectComment, setRejectComment] = useState('')

  const { data: pending = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: approvalService.getPendingArticles,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
    queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] })
    queryClient.invalidateQueries({ queryKey: ['articles'] })
  }

  const approveMutation = useMutation({
    mutationFn: ({ id, comments }) => approvalService.approveArticle(id, comments),
    onSuccess: () => {
      toast.success('Article approved!')
      setApproveModal(null)
      setApproveComment('')
      invalidate()
    },
    onError: () => toast.error('Failed to approve'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, comments }) => approvalService.rejectArticle(id, comments),
    onSuccess: () => {
      toast.success('Article rejected')
      setRejectModal(null)
      setRejectComment('')
      invalidate()
    },
    onError: () => toast.error('Failed to reject'),
  })

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle size={24} className="text-green-600" />
          Approval Queue
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and approve submitted articles
          {pending.length > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pending.length} pending
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner centered />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">All caught up!</h3>
          <p className="text-gray-400 text-sm">No articles pending review</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Article</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Author</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Submitted</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{article.title}</p>
                        {article.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{article.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-gray-600">
                      {article.author?.full_name || article.author?.name || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-500">{article.category?.name || '—'}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock size={13} />
                      {formatDate(article.updated_at || article.created_at)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/articles/${article.id}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View article"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => { setApproveModal(article); setApproveComment('') }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        onClick={() => { setRejectModal(article); setRejectComment('') }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve modal */}
      <Modal
        isOpen={!!approveModal}
        onClose={() => setApproveModal(null)}
        title="Approve Article"
        size="sm"
      >
        {approveModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Approve <strong className="text-gray-900">"{approveModal.title}"</strong>?
            </p>
            <textarea
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder="Optional approval comment..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setApproveModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => approveMutation.mutate({ id: approveModal.id, comments: approveComment })}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Reject Article"
        size="sm"
      >
        {rejectModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Rejecting <strong className="text-gray-900">"{rejectModal.title}"</strong>. Please provide a reason.
            </p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Rejection reason (required)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectComment.trim()) { toast.error('Rejection reason is required'); return }
                  rejectMutation.mutate({ id: rejectModal.id, comments: rejectComment })
                }}
                disabled={rejectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
