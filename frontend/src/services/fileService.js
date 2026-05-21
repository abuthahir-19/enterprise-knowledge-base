import api from './api.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const fileService = {
  uploadFile: async (formData) => {
    const response = await api.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getArticleFiles: async (articleId) => {
    const response = await api.get(`/api/files/article/${articleId}`)
    return response.data
  },

  deleteFile: async (id) => {
    const response = await api.delete(`/api/files/${id}`)
    return response.data
  },

  getDownloadUrl: (id) => {
    const token = localStorage.getItem('kb_token')
    return `${API_BASE_URL}/api/files/${id}?token=${token}`
  },
}

export default fileService
