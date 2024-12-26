import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'
import { useNavigate } from 'react-router-dom'

function AuthForm() {
  const { signIn } = useContext(AuthContext)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setLoading(true)
    try {
      const { error } = await signIn(username.trim())
      if (error) throw error
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-pink-200 to-yellow-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center bg-white border-4 border-double border-blue-500 shadow-lg p-6 rounded-lg">
          <div className="animate-pulse">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
            Prediction Bingo
          </h2>
          <p className="mt-2 font-bold tracking-widest text-blue-600">
            Make predictions with friends!
          </p>
          <div className="animate-pulse mt-2">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
        </div>

        {/* Username Form */}
        <div className="mt-8 bg-white border-4 border-double border-emerald-500 shadow-lg rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-transparent bg-clip-text mb-4">
              Choose Your Username
            </h3>

            {error && (
              <div className="mb-6 border-2 border-red-500 bg-red-100 p-4 animate-pulse rounded-md">
                <div className="text-sm text-red-700 font-bold blink">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="mt-1 block w-full shadow-sm sm:text-sm 
                    border-2 border-emerald-200 rounded-md
                    bg-gradient-to-br from-white to-emerald-50
                    hover:border-emerald-300 transition-colors cursor-retro
                    focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                    text-white bg-gradient-to-r from-emerald-500 to-teal-600 
                    hover:from-emerald-600 hover:to-teal-700
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                    disabled:opacity-50 cursor-retro"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    '✨ Start Playing ✨'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Marquee */}
        <div className="mt-8 overflow-hidden">
          <div className="text-center font-bold text-blue-600 animate-marquee whitespace-nowrap">
            ⭐ WELCOME TO PREDICTION BINGO! ⭐ PICK A USERNAME! ⭐ START PLAYING! ⭐ HAVE FUN! ⭐
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthForm 