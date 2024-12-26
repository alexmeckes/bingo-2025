import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'

function ReviewPredictions() {
  const { groupId } = useParams()
  const { user, supabase } = useContext(AuthContext)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [commenting, setCommenting] = useState({})
  const [newComments, setNewComments] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadGroupAndPredictions()
  }, [groupId])

  const loadGroupAndPredictions = async () => {
    if (!groupId) {
      setError('Invalid group')
      setLoading(false)
      return
    }

    try {
      // Get group details, user role, and all predictions with comments
      const [groupResponse, memberResponse, predictionsResponse] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single(),
        supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('predictions')
          .select(`
            *,
            submitted_by:users!predictions_submitted_by_fkey(email),
            comments(
              *,
              user:users!comments_user_id_fkey(email)
            )
          `)
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })
      ])

      if (groupResponse.error) throw groupResponse.error
      if (memberResponse.error) throw memberResponse.error
      if (predictionsResponse.error) throw predictionsResponse.error

      const groupData = groupResponse.data

      // Validate group is in review phase
      if (groupData.status !== 'review') {
        setError('This group is not in the review phase')
        setLoading(false)
        return
      }

      setGroup(groupData)
      setUserRole(memberResponse.data.role)
      setPredictions(predictionsResponse.data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load predictions')
      setLoading(false)
    }
  }

  const handleComment = async (predictionId) => {
    if (!newComments[predictionId]?.trim()) return

    setCommenting(prev => ({ ...prev, [predictionId]: true }))
    try {
      const { error: commentError } = await supabase
        .from('comments')
        .insert([
          {
            prediction_id: predictionId,
            user_id: user.id,
            content: newComments[predictionId].trim()
          }
        ])

      if (commentError) throw commentError

      // Refresh predictions to get new comment
      await loadGroupAndPredictions()
      setNewComments(prev => ({ ...prev, [predictionId]: '' }))
    } catch (err) {
      setError('Failed to add comment')
    } finally {
      setCommenting(prev => ({ ...prev, [predictionId]: false }))
    }
  }

  const handleStatusUpdate = async (predictionId, newStatus) => {
    if (userRole !== 'organizer') return

    try {
      const { error: updateError } = await supabase
        .from('predictions')
        .update({ status: newStatus })
        .eq('id', predictionId)

      if (updateError) throw updateError

      // Refresh predictions
      await loadGroupAndPredictions()
    } catch (err) {
      setError('Failed to update prediction status')
    }
  }

  const handleFinishReview = async () => {
    if (userRole !== 'organizer') return

    setSubmitting(true)
    try {
      // Check if all predictions have been reviewed
      const pendingPredictions = predictions.filter(p => p.status === 'pending')
      if (pendingPredictions.length > 0) {
        setError('All predictions must be approved or rejected before finishing review')
        return
      }

      // Update group status to active
      const { error: updateError } = await supabase
        .from('groups')
        .update({ status: 'active' })
        .eq('id', groupId)

      if (updateError) throw updateError

      // Navigate to group page
      navigate(`/group/${groupId}`)
    } catch (err) {
      setError('Failed to finish review')
    } finally {
      setSubmitting(false)
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Review Predictions
          </h2>
          {group && (
            <p className="mt-2 text-sm text-gray-600">
              for {group.name}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-8 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="bg-white shadow sm:rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-900">
                      {prediction.content}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Submitted by {prediction.submitted_by.email}
                    </p>
                  </div>
                  {userRole === 'organizer' && prediction.status === 'pending' && (
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(prediction.id, 'approved')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(prediction.id, 'rejected')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {prediction.status !== 'pending' && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      prediction.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {prediction.status.charAt(0).toUpperCase() + prediction.status.slice(1)}
                    </span>
                  )}
                </div>

                {/* Comments Section */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Comments</h4>
                  <div className="space-y-3">
                    {prediction.comments.map((comment) => (
                      <div key={comment.id} className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{comment.user.email}: </span>
                        {comment.content}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex space-x-3">
                    <input
                      type="text"
                      value={newComments[prediction.id] || ''}
                      onChange={(e) => setNewComments(prev => ({
                        ...prev,
                        [prediction.id]: e.target.value
                      }))}
                      placeholder="Add a comment..."
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleComment(prediction.id)}
                      disabled={commenting[prediction.id] || !newComments[prediction.id]?.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {commenting[prediction.id] ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {userRole === 'organizer' && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleFinishReview}
              disabled={submitting || predictions.some(p => p.status === 'pending')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Finishing...' : 'Finish Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewPredictions 