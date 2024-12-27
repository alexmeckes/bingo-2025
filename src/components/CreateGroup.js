import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'

function CreateGroup() {
  const navigate = useNavigate()
  const { user, supabase } = useContext(AuthContext)
  const [groupName, setGroupName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) {
      setError('Please enter a group name')
      return
    }

    if (!user && !username.trim()) {
      setError('Please enter a username')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const currentUsername = user ? user.username : username.trim()

      // First ensure user exists
      const { error: userError } = await supabase
        .from('users')
        .insert([{ username: currentUsername }])
        .select()

      if (userError && !userError.message.includes('duplicate key')) {
        throw userError
      }

      // If not logged in, save username
      if (!user) {
        localStorage.setItem('user', JSON.stringify({ username: currentUsername }))
      }

      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          name: groupName.trim(),
          organizer_username: currentUsername,
          status: 'submission',
          is_locked: false
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupData.id,
          username: currentUsername,
          role: 'admin'
        }])

      if (memberError) throw memberError

      // Navigate to the new group
      navigate(`/group/${groupData.id}`)
    } catch (err) {
      console.error('Error creating group:', err)
      setError('Failed to create group')
      setCreating(false)
    }
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
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
            Prediction Bingo
          </h2>
          <p className="mt-2 text-xl font-bold text-blue-600">
            Make predictions with friends!
          </p>
          <div className="animate-pulse mt-2">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
        </div>

        <div className="mt-8 bg-white border-4 border-double border-emerald-500 shadow-lg rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 border-2 border-red-500 bg-red-100 p-4 rounded-md">
                <div className="text-sm text-red-700 font-bold">{error}</div>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm 
                    border-2 border-indigo-200 rounded-md bg-gradient-to-br from-white to-indigo-50
                    hover:border-indigo-300 transition-colors cursor-retro"
                  disabled={creating}
                />
              </div>

              {!user && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Your Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username..."
                    className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm 
                      border-2 border-indigo-200 rounded-md bg-gradient-to-br from-white to-indigo-50
                      hover:border-indigo-300 transition-colors cursor-retro"
                    disabled={creating}
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creating || (!groupName.trim() || (!user && !username.trim()))}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                    text-white bg-gradient-to-r from-indigo-500 to-purple-600 
                    hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-retro"
                >
                  {creating ? (
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

export default CreateGroup 