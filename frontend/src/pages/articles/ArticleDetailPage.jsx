import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Edit, Trash2, Send, Archive, CheckCircle, XCircle, Globe,
  Eye, Calendar, User, FolderOpen, Tag, Download, Clock, ChevronLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext.jsx'
import articleService from '../../services/articleService.js'
import approvalService from '../../services/approvalService.js'
import fileService from '../../services/fileService.js'
import collaborationService from '../../services/collaborationService.js'
import ArticleStatusBadge from '../../components/articles/ArticleStatusBadge.jsx'
import CommentSection from '../../components/collaboration/CommentSection.jsx'
import RatingStars from '../../components/collaboration/RatingStars.jsx'
import BookmarkButton from '../../components/collaboration/BookmarkButton.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()

  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [approveComment, setApproveComment] = useState('')
  const [rejectComment, setRejectComment] = useState('')

  const { data: article, isLoading, error, refetch } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articleService.getArticle(id),
  })

  const { data: files = [] } = useQuery({
    queryKey: ['article-files', id],
    queryFn: () => fileService.getArticleFiles(id),
    enabled: !!id,
  })

  const { data: approvalHistory = [] } = useQuery({
    queryKey: ['approval-history', id],
    queryFn: () => approvalService.getApprovalHistory(id),
    enabled: !!id && hasRole(['admin', 'reviewer', 'author']),
  })

  const { data: ratingData } = useQuery({
    queryKey: ['rating', id],
    queryFn: () => collaborationService.getRating(id),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['article', id] })
    queryClient.invalidateQueries({ queryKey: ['articles'] })
  }

  const submitMutation = useMutation({
    mutationFn: () => articleService.submitForApproval(id),
    onSuccess: () => { toast.success('Submitted for approval'); invalidate() },
    onError: () => toast.error('Failed to submit'),
  })

  const archiveMutation = useMutation({
    mutationFn: () => articleService.archiveArticle(id),
    onSuccess: () => { toast.success('Article archived'); invalidate() },
    onError: () => toast.error('Failed to archive'),
  })

  const publishMutation = useMutation({
    mutationFn: () => articleService.publishArticle(id),
    onSuccess: () => { toast.success('Article published'); invalidate() },
    onError: () => toast.error('Failed to publish'),
  })

  const approveMutation = useMutation({
    mutationFn: () => approvalService.approveArticle(id, approveComment),
    onSuccess: () => {
      toast.success('Article approved')
      setApproveModal(false)
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['approval-history', id] })
    },
    onError: () => toast.error('Failed to approve'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => approvalService.rejectArticle(id, rejectComment),
    onSuccess: () => {
      toast.success('Article rejected')
      setRejectModal(false)
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['approval-history', id] })
    },
    onError: () => toast.error('Failed to reject'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => articleService.deleteArticle(id),
    onSuccess: () => {
      toast.success('Article deleted')
      navigate('/articles')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const rateMutation = useMutation({
    mutationFn: (value) => collaborationService.rateArticle(id, value),
    onSuccess: () => {
      toast.success('Rating submitted')
      queryClient.invalidateQueries({ queryKey: ['rating', id] })
      queryClient.invalidateQueries({ queryKey: ['article', id] })
    },
    onError: () => toast.error('Failed to submit rating'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (error) return <ErrorMessage message={error} onRetry={refetch} />
  if (!article) return <ErrorMessage message="Article not found" />

  const isOwner = user?.id === article.author?.id
  const isAdmin = hasRole('admin')
  const isReviewer = hasRole('reviewer')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <ArticleStatusBadge status={article.status} />
                {article.category && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FolderOpen size={12} />
                    {article.category.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 leading-snug">{article.title}</h1>
              {article.description && (
                <p className="text-gray-500 mt-2 text-base leading-relaxed">{article.description}</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 mt-5 text-sm text-gray-500">
            {article.author && (
              <span className="flex items-center gap-1.5">
                <User size={14} />
                {article.author.full_name || article.author.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(article.created_at)}
            </span>
            {article.updated_at !== article.created_at && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                Updated {formatDate(article.updated_at)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Eye size={14} />
              {article.view_count || 0} views
            </span>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium"
                >
                  <Tag size={10} />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Actions row */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-gray-100">
            <BookmarkButton articleId={id} />

            {/* Author actions */}
            {(isOwner || isAdmin) && (
              <>
                <Link
                  to={`/articles/${id}/edit`}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <Edit size={14} /> Edit
                </Link>
                {article.status === 'draft' && (
                  <button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send size={14} /> Submit for Review
                  </button>
                )}
                {['draft', 'published', 'approved'].includes(article.status) && (
                  <button
                    onClick={() => archiveMutation.mutate()}
                    disabled={archiveMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    <Archive size={14} /> Archive
                  </button>
                )}
                <button
                  onClick={() => setDeleteDialog(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}

            {/* Reviewer/Admin actions */}
            {(isReviewer || isAdmin) && article.status === 'pending_approval' && (
              <>
                <button
                  onClick={() => setApproveModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
            {(isReviewer || isAdmin) && article.status === 'approved' && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Globe size={14} /> Publish
              </button>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Average Rating</p>
            <RatingStars value={ratingData?.average_rating || article.average_rating || 0} readonly />
          </div>
          <div className="border-l border-gray-200 pl-4">
            <p className="text-xs text-gray-500 mb-1">Your Rating</p>
            <RatingStars
              value={ratingData?.user_rating || 0}
              onRate={(v) => rateMutation.mutate(v)}
            />
          </div>
        </div>

        {/* Article Content */}
        <div className="p-6 md:p-8">
          <div
            className="article-content prose max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* File Attachments */}
        {files.length > 0 && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Download size={16} className="text-gray-500" />
              Attachments ({files.length})
            </h3>
            <div className="space-y-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={fileService.getDownloadUrl(file.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                    📎
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.original_filename || file.filename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ''}
                    </p>
                  </div>
                  <Download size={14} className="text-blue-500 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Approval History */}
        {approvalHistory.length > 0 && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Approval History</h3>
            <div className="space-y-3">
              {approvalHistory.map((record, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      record.action === 'approved' ? 'bg-green-500' :
                      record.action === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  />
                  <div>
                    <span className="font-medium text-gray-900 capitalize">{record.action}</span>
                    {' by '}
                    <span className="text-gray-600">{record.reviewer?.full_name || 'Unknown'}</span>
                    <span className="text-gray-400"> · {formatDate(record.created_at)}</span>
                    {record.comments && (
                      <p className="text-gray-500 mt-0.5 italic">"{record.comments}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="px-6 pb-8 border-t border-gray-100 pt-6">
          <CommentSection articleId={id} />
        </div>
      </div>

      {/* Approve modal */}
      <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Approve Article" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Optionally add a comment before approving.</p>
          <textarea
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            placeholder="Optional comment..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setApproveModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Article" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for rejection.</p>
          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Reason for rejection (required)..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => {
                if (!rejectComment.trim()) { toast.error('Rejection reason is required'); return }
                rejectMutation.mutate()
              }}
              disabled={rejectMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
