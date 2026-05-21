import api from './api.js'

const userService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/api/users', { params })
    return response.data
  },

  getUser: async (id) => {
    const response = await api.get(`/api/users/${id}`)
    return response.data
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/api/users/${id}`, data)
    return response.data
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/api/users/${id}`)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/api/users/me')
    return response.data
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/users/me', data)
    return response.data
  },

  changePassword: async (data) => {
    const response = await api.put('/api/users/me/password', data)
    return response.data
  },
}

export default userService
