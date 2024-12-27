import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'

function JoinGroup() {
  const { groupId } = useParams()
  const { user, supabase } = useContext(AuthContext)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const [username, setUsername] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    checkGroup()
  }, [groupId])

  const checkGroup = async () => {
    if (!groupId) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    try {
      // Just check if group exists and is not locked
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError
      if (!groupData) {
        setError('This group no longer exists')
        setLoading(false)
        return
      }

      // If group is locked, show message
      if (groupData.is_locked) {
        setError('This group is no longer accepting new members')
        setGroup(groupData)
        setLoading(false)
        return
      }

      // If user is logged in, check if already a member
      if (user) {
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', groupId)
          .eq('username', user.username)
          .single()

        if (memberError && memberError.code !== 'PGRST116') throw memberError

        // If user is already a member, redirect to group
        if (memberData) {
          navigate(`/group/${groupId}`)
          return
        }
      }

      setGroup(groupData)
      setLoading(false)
    } catch (err) {
      console.error('Error checking group:', err)
      setError('Failed to load group details')
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setJoining(true)
    setError(null)

    try {
      // First ensure user exists in users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{ username: username.trim() }])
        .select()

      if (userError && !userError.message.includes('duplicate key')) {
        throw userError
      }

      // Double check group isn't locked
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('is_locked')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError
      if (groupData.is_locked) {
        setError('This group is no longer accepting new members')
        setJoining(false)
        return
      }

      // Add user to group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          username: username.trim(),
          role: 'member'
        }])

      if (joinError) throw joinError

      // Navigate to group page
      navigate(`/group/${groupId}`)
    } catch (err) {
      console.error('Error joining group:', err)
      setError('Failed to join group')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-pink-200 to-yellow-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center bg-white border-4 border-double border-blue-500 shadow-lg p-6 rounded-lg">
          <div className="animate-pulse">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
          {error ? (
            <>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Oops!
              </h2>
              <p className="mt-4 text-lg text-red-600">
                {error}
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-gradient-to-r from-indigo-500 to-purple-600 
                  hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-indigo-500 cursor-retro"
              >
                Return Home
              </button>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Join Group
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                You've been invited to join
              </p>
              <p className="mt-2 text-2xl font-bold text-indigo-600">
                {group?.name}
              </p>
              {!user && (
                <div className="mt-6">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username..."
                    className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-retro"
                    disabled={joining}
                  />
                </div>
              )}
              <button
                onClick={user ? handleJoin : handleJoin}
                disabled={joining || (!user && !username.trim())}
                className="mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-gradient-to-r from-indigo-500 to-purple-600 
                  hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-retro"
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
            </>
          )}
          <div className="animate-pulse mt-2">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinGroup 