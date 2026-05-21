import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Trash2, Reply, Send, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import collaborationService from '../../services/collaborationService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function CommentItem({ comment, articleId, currentUser, onDelete }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const queryClient = useQueryClient()

  const replyMutation = useMutation({
    mutationFn: (content) => collaborationService.addComment(articleId, content, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] })
      setReplyText('')
      setShowReply(false)
      toast.success('Reply added')
    },
    onError: () => toast.error('Failed to add reply'),
  })

  const canDelete =
    currentUser?.id === comment.author?.id || currentUser?.role === 'admin'

  return (
    <div className="group">
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
          {getInitials(comment.author?.full_name || comment.author?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">
                {comment.author?.full_name || comment.author?.name || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-1">
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Reply size={12} />
              Reply
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
          </div>

          {/* Reply form */}
          {showReply && (
            <div className="mt-3 flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => replyText.trim() && replyMutation.mutate(replyText.trim())}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
                <button
                  onClick={() => setShowReply(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-200">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  articleId={articleId}
                  currentUser={currentUser}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CommentSection({ articleId }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', articleId],
    queryFn: () => collaborationService.getComments(articleId),
  })

  const addMutation = useMutation({
    mutationFn: (content) => collaborationService.addComment(articleId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] })
      setNewComment('')
      toast.success('Comment added')
    },
    onError: () => toast.error('Failed to add comment'),
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId) => collaborationService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] })
      toast.success('Comment deleted')
    },
    onError: () => toast.error('Failed to delete comment'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newComment.trim()) {
      addMutation.mutate(newComment.trim())
    }
  }

  // Filter top-level comments (no parent_id)
  const topLevelComments = Array.isArray(comments)
    ? comments.filter((c) => !c.parent_id)
    : []

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments {topLevelComments.length > 0 && `(${topLevelComments.length})`}
        </h3>
      </div>

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.full_name || user?.name)}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || addMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <Send size={14} />
                {addMutation.isPending ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      {isLoading ? (
        <LoadingSpinner centered />
      ) : topLevelComments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              currentUser={user}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
