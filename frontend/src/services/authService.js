import api from './api.js'

const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data
  },

  register: async (data) => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },
}

export default authService
