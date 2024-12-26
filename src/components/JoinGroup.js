import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'

function JoinGroup() {
  const { groupId } = useParams()
  const { user, supabase, signIn } = useContext(AuthContext)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const [joining, setJoining] = useState(false)
  const [username, setUsername] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkGroup()
    } else {
      setLoading(false)
    }
  }, [groupId, user])

  const checkGroup = async () => {
    if (!groupId) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    try {
      // Check if group exists and get its details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*, group_members(username)')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError

      if (!groupData) {
        setError('Group not found')
        setLoading(false)
        return
      }

      // Check if user is already a member
      const isMember = groupData.group_members.some(member => member.username === user.username)
      if (isMember) {
        navigate(`/group/${groupId}`)
        return
      }

      // Check if group is in submission phase
      if (groupData.status !== 'submission') {
        setError('This group is no longer accepting new members')
        setLoading(false)
        return
      }

      // Check member count
      if (groupData.group_members.length >= 15) {
        setError('This group has reached its maximum capacity')
        setLoading(false)
        return
      }

      setGroup(groupData)
      setLoading(false)
    } catch (err) {
      setError('Failed to load group details')
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setJoining(true)
    setError(null)

    try {
      const { error: joinError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupId,
            username: user.username,
            role: 'member'
          }
        ])

      if (joinError) throw joinError

      // Navigate to group page
      navigate(`/group/${groupId}`)
    } catch (err) {
      setError('Failed to join group')
      setJoining(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setAuthLoading(true)
    try {
      const { error } = await signIn(username.trim())
      if (error) throw error
      // After sign in, useEffect will trigger checkGroup
    } catch (err) {
      setError(err.message)
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-200 via-pink-200 to-yellow-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Show auth form if user is not logged in
  if (!user) {
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
              Join Prediction Group
            </h2>
            <p className="mt-2 font-bold tracking-widest text-blue-600">
              Choose a username to continue!
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
              {error && (
                <div className="mb-6 border-2 border-red-500 bg-red-100 p-4 animate-pulse rounded-md">
                  <div className="text-sm text-red-700 font-bold blink">{error}</div>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
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
                    disabled={authLoading}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                      text-white bg-gradient-to-r from-emerald-500 to-teal-600 
                      hover:from-emerald-600 hover:to-teal-700
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                      disabled:opacity-50 cursor-retro"
                  >
                    {authLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </span>
                    ) : (
                      '✨ Join Group ✨'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Marquee */}
          <div className="mt-8 overflow-hidden">
            <div className="text-center font-bold text-blue-600 animate-marquee whitespace-nowrap">
              ⭐ WELCOME TO PREDICTION BINGO! ⭐ PICK A USERNAME! ⭐ JOIN THE GROUP! ⭐ HAVE FUN! ⭐
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-pink-200 to-yellow-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {error ? (
          <div className="bg-white border-4 border-double border-red-500 shadow-lg p-6 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-bold text-red-600 mb-2">Oops!</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-gradient-to-r from-red-500 to-pink-600 
                  hover:from-red-600 hover:to-pink-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                  cursor-retro"
              >
                Return Home
              </button>
            </div>
          </div>
        ) : group ? (
          <div>
            <div className="text-center bg-white border-4 border-double border-blue-500 shadow-lg p-6 rounded-lg">
              <div className="animate-pulse">
                <span className="text-red-500">★</span>
                <span className="text-yellow-500">★</span>
                <span className="text-green-500">★</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
                {group.name}
              </h2>
              <p className="mt-2 font-bold tracking-widest text-blue-600">
                Join this prediction group!
              </p>
              <div className="animate-pulse mt-2">
                <span className="text-red-500">★</span>
                <span className="text-yellow-500">★</span>
                <span className="text-green-500">★</span>
              </div>
            </div>

            <div className="mt-8 bg-white border-4 border-double border-emerald-500 shadow-lg rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-center">
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                      text-white bg-gradient-to-r from-emerald-500 to-teal-600 
                      hover:from-emerald-600 hover:to-teal-700
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                      disabled:opacity-50 cursor-retro"
                  >
                    {joining ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </span>
                    ) : (
                      '✨ Join Group ✨'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default JoinGroup 