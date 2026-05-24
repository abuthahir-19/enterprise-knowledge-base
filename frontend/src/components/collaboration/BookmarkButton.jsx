import React from 'react'
import { Bookmark } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import collaborationService from '../../services/collaborationService.js'

export default function BookmarkButton({ articleId }) {
  const queryClient = useQueryClient()

  const { data: bookmarkData, isLoading } = useQuery({
    queryKey: ['bookmark', articleId],
    queryFn: () => collaborationService.checkBookmark(articleId),
    retry: false,
  })

  const isBookmarked = bookmarkData?.is_bookmarked ?? false

  const addMutation = useMutation({
    mutationFn: () => collaborationService.bookmarkArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', articleId] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      toast.success('Article bookmarked')
    },
    onError: () => toast.error('Failed to bookmark article'),
  })

  const removeMutation = useMutation({
    mutationFn: () => collaborationService.removeBookmark(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', articleId] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      toast.success('Bookmark removed')
    },
    onError: () => toast.error('Failed to remove bookmark'),
  })

  const handleToggle = () => {
    if (isBookmarked) {
      removeMutation.mutate()
    } else {
      addMutation.mutate()
    }
  }

  const isPending = addMutation.isPending || removeMutation.isPending || isLoading

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this article'}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
        isBookmarked
          ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      } disabled:opacity-50`}
    >
      <Bookmark
        size={16}
        className={isBookmarked ? 'fill-blue-600 text-blue-600' : 'text-gray-500'}
      />
      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  )
}
