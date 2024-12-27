import { createContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export const AuthContext = createContext({
  user: null,
  supabase,
  loading: true,
  login: () => {}
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Error parsing stored user:', e)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  // Function to handle login
  const login = (username) => {
    const userData = { username }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // Update user state whenever localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue))
          } catch (err) {
            console.error('Error parsing user data:', err)
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <AuthContext.Provider value={{ user, supabase, loading, login }}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 