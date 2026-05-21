import api from './api.js'

const collaborationService = {
  getComments: async (articleId) => {
    const response = await api.get(`/api/collaboration/articles/${articleId}/comments`)
    return response.data
  },

  addComment: async (articleId, content, parentId = null) => {
    const body = { content }
    if (parentId) body.parent_id = parentId
    const response = await api.post(`/api/collaboration/articles/${articleId}/comments`, body)
    return response.data
  },

  updateComment: async (commentId, content) => {
    const response = await api.put(`/api/collaboration/comments/${commentId}`, { content })
    return response.data
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/api/collaboration/comments/${commentId}`)
    return response.data
  },

  rateArticle: async (articleId, value) => {
    const response = await api.post(`/api/collaboration/articles/${articleId}/rate`, { value })
    return response.data
  },

  getRating: async (articleId) => {
    const response = await api.get(`/api/collaboration/articles/${articleId}/rating`)
    return response.data
  },

  bookmarkArticle: async (articleId) => {
    const response = await api.post(`/api/collaboration/articles/${articleId}/bookmark`)
    return response.data
  },

  removeBookmark: async (articleId) => {
    const response = await api.delete(`/api/collaboration/articles/${articleId}/bookmark`)
    return response.data
  },

  checkBookmark: async (articleId) => {
    const response = await api.get(`/api/collaboration/articles/${articleId}/bookmark`)
    return response.data
  },

  getBookmarks: async () => {
    const response = await api.get('/api/collaboration/bookmarks')
    return response.data
  },
}

export default collaborationService
