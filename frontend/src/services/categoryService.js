import api from './api.js'

const categoryService = {
  getCategories: async () => {
    const response = await api.get('/api/categories')
    return response.data
  },

  createCategory: async (data) => {
    const response = await api.post('/api/categories', data)
    return response.data
  },

  updateCategory: async (id, data) => {
    const response = await api.put(`/api/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/api/categories/${id}`)
    return response.data
  },
}

export default categoryService
