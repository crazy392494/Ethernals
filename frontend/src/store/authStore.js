import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Login failed'
          return { success: false, error: errorMsg }
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', { name, email, password })
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed'
          return { success: false, error: errorMsg }
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        delete api.defaults.headers.common['Authorization']
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken })
          set({ accessToken: data.accessToken })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
          return true
        } catch {
          get().logout()
          return false
        }
      },

      initAuth: () => {
        const { accessToken } = get()
        if (accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        }
      },
    }),
    {
      name: 'traveloop-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
