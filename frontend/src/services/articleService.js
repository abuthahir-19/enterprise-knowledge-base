import api from './api.js'

const articleService = {
  getArticles: async (params = {}) => {
    const response = await api.get('/api/articles', { params })
    return response.data
  },

  getMyArticles: async () => {
    const response = await api.get('/api/articles/my')
    return response.data
  },

  getArticle: async (id) => {
    const response = await api.get(`/api/articles/${id}`)
    return response.data
  },

  createArticle: async (data) => {
    const response = await api.post('/api/articles', data)
    return response.data
  },

  updateArticle: async (id, data) => {
    const response = await api.put(`/api/articles/${id}`, data)
    return response.data
  },

  deleteArticle: async (id) => {
    const response = await api.delete(`/api/articles/${id}`)
    return response.data
  },

  submitForApproval: async (id) => {
    const response = await api.post(`/api/articles/${id}/submit`)
    return response.data
  },

  publishArticle: async (id) => {
    const response = await api.post(`/api/articles/${id}/publish`)
    return response.data
  },

  archiveArticle: async (id) => {
    const response = await api.post(`/api/articles/${id}/archive`)
    return response.data
  },
}

export default articleService
