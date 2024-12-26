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

      // Check if submission deadline has passed
      if (new Date(groupData.submission_deadline) < new Date()) {
        setError('The submission deadline for this group has passed')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {error ? (
          <div>
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Return to Home
              </button>
            </div>
          </div>
        ) : group ? (
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Join Prediction Group
            </h2>
            <div className="mt-4 bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {group.name}
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Submission Deadline: {new Date(group.submission_deadline).toLocaleDateString()}</p>
                  <p className="mt-1">Current Members: {group.group_members.length}</p>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                      'Join Group'
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