import { createContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if we have a username in localStorage
    const username = localStorage.getItem('username')
    if (username) {
      setUser({ username })
    }
    setLoading(false)
  }, [])

  const signIn = async (username) => {
    try {
      setError(null)
      
      // First, disable RLS temporarily for this operation
      await supabase.rpc('disable_rls')
      
      // Check if username exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (!existingUser) {
        // Create new user if doesn't exist
        const { error: createError } = await supabase
          .from('users')
          .insert([{ username }])

        if (createError) throw createError
      }

      // Re-enable RLS
      await supabase.rpc('enable_rls')

      // Store username and set user
      localStorage.setItem('username', username)
      setUser({ username })
      return { user: { username }, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error.message)
      return { user: null, error }
    }
  }

  const signOut = () => {
    localStorage.removeItem('username')
    setUser(null)
  }

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    supabase
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 