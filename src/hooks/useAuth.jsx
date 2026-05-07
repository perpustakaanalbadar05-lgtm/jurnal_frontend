import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = authService.getCurrentUser()
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser)
      // Refresh user data from server
      authService.getUser()
        .then(freshUser => {
          setUser(freshUser)
          sessionStorage.setItem('apms_user', JSON.stringify(freshUser))
        })
        .catch(() => {
          sessionStorage.removeItem('apms_token')
          sessionStorage.removeItem('apms_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Idle timeout (Auto logout after 15 minutes of inactivity)
  useEffect(() => {
    if (!user) return

    let timeoutId
    const INACTIVITY_LIMIT = 15 * 60 * 1000 // 15 menit

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        logout()
        alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit.')
      }, INACTIVITY_LIMIT)
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, resetTimer))
    
    resetTimer()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach(event => window.removeEventListener(event, resetTimer))
    }
  }, [user])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const isAdmin = () => user && ['admin', 'super_admin'].includes(user.role)
  const isReviewer = () => user && user.role === 'reviewer'
  const isAuthor = () => user && user.role === 'author'
  const isSuperAdmin = () => user && user.role === 'super_admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isReviewer, isAuthor, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
