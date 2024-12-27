import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'

function CreateGroup() {
  const { user, supabase } = useContext(AuthContext)
  const navigate = useNavigate()

  const [groupName, setGroupName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [recentGroups, setRecentGroups] = useState([])

  useEffect(() => {
    loadRecentGroups()
  }, [])

  const loadRecentGroups = () => {
    const storedGroups = localStorage.getItem('recentGroups')
    if (storedGroups) {
      setRecentGroups(JSON.parse(storedGroups))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: groupName,
          organizer_username: user.username,
          status: 'submission'
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // Add creator as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: group.id,
          username: user.username,
          role: 'admin'
        }])

      if (memberError) throw memberError

      // Navigate to the new group
      navigate(`/group/${group.id}`)
    } catch (err) {
      console.error('Error creating group:', err)
      setError('Failed to create group')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-pink-200 to-yellow-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Create Group Card */}
        <div className="text-center bg-white border-4 border-double border-blue-500 shadow-lg p-6 rounded-lg">
          <div className="animate-pulse">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
            Create a Prediction Group
          </h2>
          <div className="animate-pulse mt-2">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
        </div>

        {error && (
          <div className="mt-8 border-2 border-red-500 bg-red-100 p-4 animate-pulse rounded-md">
            <div className="text-sm text-red-700 font-bold blink">{error}</div>
          </div>
        )}

        {/* Create Group Form */}
        <div className="mt-8 bg-white border-4 border-double border-emerald-500 shadow-lg rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                  Group Name
                </label>
                <input
                  type="text"
                  name="groupName"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter a fun name for your group..."
                  required
                  className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm 
                    border-2 border-indigo-200 rounded-md bg-gradient-to-br from-white to-indigo-50
                    hover:border-indigo-300 transition-colors cursor-retro"
                  disabled={submitting}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !groupName.trim()}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                    text-white bg-gradient-to-r from-indigo-500 to-purple-600 
                    hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-retro"
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    '✨ Create Group ✨'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Groups */}
        {recentGroups.length > 0 && (
          <div className="mt-8 bg-white border-4 border-double border-pink-500 shadow-lg rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-transparent bg-clip-text">
                Your Recent Groups
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {recentGroups.map((group) => (
                <li 
                  key={group.id} 
                  onClick={() => navigate(`/group/${group.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-retro"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {group.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last visited: {new Date(group.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-pink-400"></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Marquee */}
        <div className="mt-8 overflow-hidden">
          <div className="text-center font-bold text-blue-600 animate-marquee whitespace-nowrap">
            ⭐ CREATE A NEW GROUP! ⭐ INVITE YOUR FRIENDS! ⭐ MAKE PREDICTIONS! ⭐
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateGroup 