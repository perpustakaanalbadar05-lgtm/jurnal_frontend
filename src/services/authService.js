import api from './api'

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/login', { email, password })
    sessionStorage.setItem('apms_token', data.token)
    sessionStorage.setItem('apms_user', JSON.stringify(data.user))
    return data
  },

  async logout() {
    await api.post('/logout')
    sessionStorage.removeItem('apms_token')
    sessionStorage.removeItem('apms_user')
  },

  async getUser() {
    const { data } = await api.get('/user')
    return data
  },

  getCurrentUser() {
    const user = sessionStorage.getItem('apms_user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated() {
    return !!sessionStorage.getItem('apms_token')
  },
}
