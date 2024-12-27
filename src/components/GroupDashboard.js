import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'
import Breadcrumbs from './Breadcrumbs'

// Color mapping for users
const colors = [
  'indigo', 'emerald', 'amber', 'rose', 'violet', 
  'cyan', 'fuchsia', 'lime', 'orange', 'teal',
  'blue', 'green', 'yellow', 'red', 'purple',
  'sky', 'pink', 'slate', 'stone', 'neutral'
]

const getColorForUser = (username, existingColors = {}) => {
  // Use the username to generate a consistent index
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorIndex = hash % colors.length
  
  // If color is taken, find the next available one
  let finalColorIndex = colorIndex
  while (Object.values(existingColors).includes(colors[finalColorIndex])) {
    finalColorIndex = (finalColorIndex + 1) % colors.length
  }
  
  return colors[finalColorIndex]
}

const getDotColor = (color) => {
  const colorMap = {
    indigo: 'bg-indigo-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    violet: 'bg-violet-400',
    cyan: 'bg-cyan-400',
    fuchsia: 'bg-fuchsia-400',
    lime: 'bg-lime-400',
    orange: 'bg-orange-400',
    teal: 'bg-teal-400',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
    sky: 'bg-sky-400',
    pink: 'bg-pink-400',
    slate: 'bg-slate-400',
    stone: 'bg-stone-400',
    neutral: 'bg-neutral-400'
  }
  return colorMap[color] || ''
}

const getTextColor = (color) => {
  const colorMap = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    violet: 'text-violet-600',
    cyan: 'text-cyan-600',
    fuchsia: 'text-fuchsia-600',
    lime: 'text-lime-600',
    orange: 'text-orange-600',
    teal: 'text-teal-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    sky: 'text-sky-600',
    pink: 'text-pink-600',
    slate: 'text-slate-600',
    stone: 'text-stone-600',
    neutral: 'text-neutral-600'
  }
  return colorMap[color] || ''
}

function GroupDashboard() {
  const { groupId } = useParams()
  const { user, supabase } = useContext(AuthContext)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [userPredictionCount, setUserPredictionCount] = useState(0)
  const [stats, setStats] = useState({
    memberCount: 0
  })
  const [copied, setCopied] = useState(false)
  const [recentGroups, setRecentGroups] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadGroupData()
    loadRecentGroups()
  }, [groupId])

  const loadRecentGroups = () => {
    const storedGroups = localStorage.getItem('recentGroups')
    if (storedGroups) {
      setRecentGroups(JSON.parse(storedGroups))
    }
  }

  const addToRecentGroups = (groupData) => {
    const storedGroups = localStorage.getItem('recentGroups')
    let groups = storedGroups ? JSON.parse(storedGroups) : []
    
    // Remove if already exists
    groups = groups.filter(g => g.id !== groupData.id)
    
    // Add to beginning of array
    groups.unshift({
      id: groupData.id,
      name: groupData.name,
      timestamp: new Date().toISOString()
    })
    
    // Keep only last 5 groups
    groups = groups.slice(0, 5)
    
    localStorage.setItem('recentGroups', JSON.stringify(groups))
    setRecentGroups(groups)
  }

  const loadGroupData = async () => {
    if (!groupId) {
      setError('Invalid group')
      setLoading(false)
      return
    }

    try {
      // Get group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError
      if (!groupData) throw new Error('Group not found')

      // Get members and user's predictions
      const [membersResponse, predictionsResponse] = await Promise.all([
        supabase
          .from('group_members')
          .select('username, role')
          .eq('group_id', groupId),
        supabase
          .from('predictions')
          .select('*')
          .eq('group_id', groupId)
          .eq('username', user.username)
      ])

      if (membersResponse.error) throw membersResponse.error
      if (predictionsResponse.error) throw predictionsResponse.error

      // Check if current user is admin
      const isUserAdmin = membersResponse.data?.some(
        member => member.username === user.username && member.role === 'admin'
      )

      setGroup(groupData)
      setMembers(membersResponse.data || [])
      setUserPredictionCount(predictionsResponse.data.length)
      setStats({
        memberCount: membersResponse.data?.length || 0
      })
      setIsAdmin(isUserAdmin)
      
      // Add to recent groups
      addToRecentGroups(groupData)
      
    } catch (err) {
      console.error('Error loading group:', err)
      setError(err.message || 'Failed to load group data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLock = async () => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ is_locked: !group.is_locked })
        .eq('id', groupId)

      if (error) throw error

      // Refresh group data
      loadGroupData()
    } catch (err) {
      console.error('Error toggling lock:', err)
      setError('Failed to update group settings')
    }
  }

  const getPhaseAction = () => {
    if (!group) return null

    switch (group.status || 'submission') {
      case 'submission':
        return {
          title: 'Predictions',
          description: 'Add or review predictions for the group',
          actions: [
            {
              text: userPredictionCount > 0 ? 'Edit & Review Submissions' : 'Submit Predictions',
              href: `/group/${groupId}/submit`,
              primary: true
            }
          ]
        }
      case 'active':
        return {
          title: 'Play Bingo',
          description: 'Track which predictions come true',
          actions: [
            {
              text: 'View Bingo Card',
              href: `/group/${groupId}/card`,
              primary: true
            }
          ]
        }
      default:
        return null
    }
  }

  const handleCopyInviteLink = async () => {
    try {
      const inviteUrl = `${window.location.origin}/join/${groupId}`
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy link')
    }
  }

  // Assign colors to members
  const getMemberColors = (members) => {
    const colorMap = {}
    members.forEach(member => {
      colorMap[member.username] = getColorForUser(member.username, colorMap)
    })
    return colorMap
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const phaseAction = getPhaseAction()

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-pink-200 to-yellow-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs group={group} />
        
        {/* Group Header */}
        <div className="text-center bg-white border-4 border-double border-blue-500 shadow-lg p-6 rounded-lg">
          <div className="animate-pulse">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
            {group?.name || 'Loading...'}
          </h2>
          <p className="mt-2 font-bold tracking-widest text-blue-600">
            {group?.status ? `${group.status.charAt(0).toUpperCase()}${group.status.slice(1)} Phase` : 'Submission Phase'}
          </p>
          {group?.is_locked && (
            <p className="mt-2 text-sm font-medium text-red-600">
              🔒 This group is locked
            </p>
          )}
          <div className="animate-pulse mt-2">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
        </div>

        {error && (
          <div className="mt-8 border-2 border-red-500 bg-red-100 p-4 animate-pulse">
            <div className="text-sm text-red-700 font-bold blink">{error}</div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Current Phase Card */}
          {phaseAction && (
            <div className="bg-white border-4 border-double border-emerald-500 shadow-lg p-6 rounded-lg transform hover:scale-105 transition-transform">
              <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-transparent bg-clip-text">
                {phaseAction.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {phaseAction.description}
              </p>
              <div className="mt-4 space-y-2">
                {phaseAction.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.href)}
                    className={`w-full flex justify-center py-2 px-4 border cursor-retro
                      ${action.primary 
                        ? 'border-transparent bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                        : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                      } rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats Card */}
          <div className="bg-white border-4 border-double border-amber-500 shadow-lg p-6 rounded-lg transform hover:scale-105 transition-transform">
            <h3 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text">
              Group Settings
            </h3>
            <dl className="mt-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Members</dt>
                <dd className="mt-1 text-2xl font-semibold bg-gradient-to-br from-amber-600 to-orange-600 text-transparent bg-clip-text">
                  {members.length}
                </dd>
              </div>
            </dl>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleCopyInviteLink}
                className="w-full flex justify-center py-2 px-4 border border-transparent cursor-retro
                  bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700
                  text-white rounded-md shadow-sm text-sm font-medium 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                {copied ? '✨ Link Copied! ✨' : '✨ Copy Invite Link ✨'}
              </button>
              {isAdmin && (
                <button
                  onClick={handleToggleLock}
                  className="w-full flex justify-center py-2 px-4 border border-transparent cursor-retro
                    bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700
                    text-white rounded-md shadow-sm text-sm font-medium 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  {group?.is_locked ? '🔓 Unlock Group' : '🔒 Lock Group'}
                </button>
              )}
              <button
                onClick={() => navigate(`/group/${groupId}/card`)}
                className="w-full flex justify-center py-2 px-4 border border-transparent cursor-retro
                  bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700
                  text-white rounded-md shadow-sm text-sm font-medium 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Preview Bingo Board
              </button>
            </div>
          </div>

          {/* Recent Groups */}
          {recentGroups.length > 0 && (
            <div className="lg:col-span-2 bg-white border-4 border-double border-pink-500 shadow-lg rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-transparent bg-clip-text">
                  Recent Groups
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {recentGroups.map((recentGroup) => (
                  <li 
                    key={recentGroup.id} 
                    onClick={() => navigate(`/group/${recentGroup.id}`)}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-retro"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {recentGroup.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last visited: {new Date(recentGroup.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-pink-400"></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Members List */}
          <div className="lg:col-span-2 bg-white border-4 border-double border-violet-500 shadow-lg rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-transparent bg-clip-text">
                Group Members
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {members.map((member) => {
                const color = getColorForUser(member.username)
                return (
                  <li key={member.username} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${getTextColor(color)}`}>
                          {member.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </p>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${getDotColor(color)}`}></div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Marquee */}
        <div className="mt-8 overflow-hidden">
          <div className="text-center font-bold text-blue-600 animate-marquee whitespace-nowrap">
            ⭐ WELCOME TO YOUR PREDICTION GROUP! ⭐ MAKE YOUR PREDICTIONS! ⭐ CHECK THE BINGO BOARD! ⭐
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupDashboard 