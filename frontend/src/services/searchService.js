import api from './api.js'

const searchService = {
  search: async (params = {}) => {
    const response = await api.get('/api/search', { params })
    return response.data
  },
}

export default searchService
