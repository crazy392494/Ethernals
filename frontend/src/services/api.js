import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is set in auth store initAuth()
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true
      try {
        // Import dynamically to avoid circular deps
        const { useAuthStore } = await import('../store/authStore')
        const refreshed = await useAuthStore.getState().refreshAccessToken()
        if (refreshed) {
          const { accessToken } = useAuthStore.getState()
          original.headers['Authorization'] = `Bearer ${accessToken}`
          return api(original)
        }
      } catch {
        // Refresh failed — logout
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Trip APIs
export const tripApi = {
  getAll: (params) => api.get('/trips', { params }),
  getUpcoming: () => api.get('/trips/upcoming'),
  getById: (id) => api.get(`/trips/${id}`),
  getShared: (token) => api.get(`/trips/share/${token}`),
  create: (data) => api.post('/trips', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/trips/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/trips/${id}`),
  share: (id) => api.post(`/trips/${id}/share`),
  revokeShare: (id) => api.delete(`/trips/${id}/share`),
}

// Stop APIs
export const stopApi = {
  getByTrip: (tripId) => api.get(`/stops/trip/${tripId}`),
  create: (data) => api.post('/stops', data),
  update: (id, data) => api.put(`/stops/${id}`, data),
  delete: (id) => api.delete(`/stops/${id}`),
  reorder: (tripId, stopIds) => api.put(`/stops/reorder/${tripId}`, { stopIds }),
}

// Activity APIs
export const activityApi = {
  search: (params) => api.get('/activities/search', { params }),
  getByStop: (stopId) => api.get(`/activities/stop/${stopId}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
}

// Budget APIs
export const budgetApi = {
  getByTrip: (tripId) => api.get(`/budget/trip/${tripId}`),
  update: (tripId, data) => api.put(`/budget/trip/${tripId}`, data),
}

// Note APIs
export const noteApi = {
  getByTrip: (tripId) => api.get(`/notes/trip/${tripId}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
}

// Packing APIs
export const packingApi = {
  getByTrip: (tripId) => api.get(`/packing/trip/${tripId}`),
  addItem: (data) => api.post('/packing/item', data),
  updateItem: (id, data) => api.put(`/packing/item/${id}`, data),
  deleteItem: (id) => api.delete(`/packing/item/${id}`),
  reset: (tripId) => api.put(`/packing/reset/${tripId}`),
}

// City APIs
export const cityApi = {
  search: (params) => api.get('/cities/search', { params }),
  getPopular: () => api.get('/cities/popular'),
}

// User APIs
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/users/change-password', data),
  saveDestination: (data) => api.post('/users/saved-destinations', data),
  removeDestination: (id) => api.delete(`/users/saved-destinations/${id}`),
  deleteAccount: (data) => api.delete('/users/account', { data }),
}

// Admin APIs
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getTrips: (params) => api.get('/admin/trips', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
}

// Weather APIs
export const weatherApi = {
  getWeather: (city) => api.get(`/weather/${encodeURIComponent(city)}`),
}

// AI APIs
export const aiApi = {
  suggestItinerary: (data) => api.post('/ai/suggest-itinerary', data),
  estimateBudget: (data) => api.post('/ai/budget-estimate', data),
  recommendDestinations: (data) => api.post('/ai/destination-recommend', data),
}
