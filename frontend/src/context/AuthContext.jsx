import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authService from '../services/authService.js'
import userService from '../services/userService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('kb_token'))
  const [isLoading, setIsLoading] = useState(true)

  // Decode JWT payload (without verification — just to read claims)
  const decodeToken = (tkn) => {
    try {
      const payload = tkn.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      return decoded
    } catch {
      return null
    }
  }

  // Restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('kb_token')
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      // Check token expiry
      const decoded = decodeToken(storedToken)
      if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('kb_token')
        localStorage.removeItem('kb_user')
        setToken(null)
        setUser(null)
        setIsLoading(false)
        return
      }

      // Try restoring from localStorage first, then validate with server
      const storedUser = localStorage.getItem('kb_user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          // ignore
        }
      }

      try {
        const profile = await userService.getProfile()
        setUser(profile)
        localStorage.setItem('kb_user', JSON.stringify(profile))
      } catch {
        localStorage.removeItem('kb_token')
        localStorage.removeItem('kb_user')
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    const { access_token } = data
    localStorage.setItem('kb_token', access_token)
    setToken(access_token)

    // Fetch full profile
    const profile = await userService.getProfile()
    setUser(profile)
    localStorage.setItem('kb_user', JSON.stringify(profile))
    return profile
  }, [])

  const register = useCallback(async (formData) => {
    const data = await authService.register(formData)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('kb_token')
    localStorage.removeItem('kb_user')
    setToken(null)
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (roles) => {
      if (!user) return false
      if (Array.isArray(roles)) return roles.includes(user.role)
      return user.role === roles
    },
    [user]
  )

  const updateUserInContext = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('kb_user', JSON.stringify(updatedUser))
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
    hasRole,
    updateUserInContext,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
