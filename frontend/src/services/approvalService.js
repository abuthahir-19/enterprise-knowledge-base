import api from './api.js'

const approvalService = {
  getPendingArticles: async () => {
    const response = await api.get('/api/approvals/pending')
    return response.data
  },

  approveArticle: async (id, comments = '') => {
    const response = await api.post(`/api/approvals/${id}/approve`, { comments })
    return response.data
  },

  rejectArticle: async (id, comments) => {
    const response = await api.post(`/api/approvals/${id}/reject`, { comments })
    return response.data
  },

  getApprovalHistory: async (articleId) => {
    const response = await api.get(`/api/approvals/history/${articleId}`)
    return response.data
  },
}

export default approvalService
