import api from './api.js'

const tagService = {
  getTags: async () => {
    const response = await api.get('/api/tags')
    return response.data
  },

  createTag: async (data) => {
    const response = await api.post('/api/tags', data)
    return response.data
  },

  deleteTag: async (id) => {
    const response = await api.delete(`/api/tags/${id}`)
    return response.data
  },
}

export default tagService
