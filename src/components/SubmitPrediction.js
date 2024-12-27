import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'
import Breadcrumbs from './Breadcrumbs'

function SubmitPrediction() {
  const { groupId } = useParams()
  const { user, supabase } = useContext(AuthContext)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const [predictions, setPredictions] = useState([''])
  const [userPredictionCount, setUserPredictionCount] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [allPredictions, setAllPredictions] = useState([])

  useEffect(() => {
    checkGroupAndPredictions()
  }, [groupId])

  const checkGroupAndPredictions = async () => {
    if (!groupId) {
      setError('Invalid group')
      setLoading(false)
      return
    }

    try {
      // Get group details and user's existing predictions
      const [groupResponse, predictionsResponse, allPredictionsResponse] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single(),
        supabase
          .from('predictions')
          .select('*')
          .eq('group_id', groupId)
          .eq('username', user.username),
        supabase
          .from('predictions')
          .select('content, username')
          .eq('group_id', groupId)
      ])

      if (groupResponse.error) throw groupResponse.error
      if (predictionsResponse.error) throw predictionsResponse.error
      if (allPredictionsResponse.error) throw allPredictionsResponse.error

      const groupData = groupResponse.data
      
      // Validate group status
      if (groupData.status !== 'submission') {
        setError('This group is no longer accepting predictions')
        setLoading(false)
        return
      }

      // Get member IDs for display
      const { data: members } = await supabase
        .from('group_members')
        .select('username')
        .eq('group_id', groupId)

      // Format predictions with member info
      const predictionsWithMembers = allPredictionsResponse.data.map(prediction => ({
        ...prediction,
        isCurrentUser: prediction.username === user.username
      }))

      setGroup(groupData)
      setUserPredictionCount(predictionsResponse.data.length)
      setHasSubmitted(predictionsResponse.data.length > 0)
      setAllPredictions(predictionsWithMembers)
      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load group details')
      setLoading(false)
    }
  }

  const handleAddPrediction = () => {
    if (predictions.length < 5) {
      setPredictions([...predictions, ''])
    }
  }

  const handleRemovePrediction = (index) => {
    const newPredictions = predictions.filter((_, i) => i !== index)
    setPredictions(newPredictions)
  }

  const handlePredictionChange = (index, value) => {
    const newPredictions = [...predictions]
    newPredictions[index] = value
    setPredictions(newPredictions)
  }

  const validatePredictions = () => {
    if (predictions.some(p => !p.trim())) {
      setError('Please fill in all prediction fields')
      return false
    }

    if (predictions.length + userPredictionCount > 5) {
      setError('You can only submit up to 5 predictions in total')
      return false
    }

    if (predictions.some(p => p.length > 280)) {
      setError('Predictions must be 280 characters or less')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validatePredictions()) return

    setSubmitting(true)
    try {
      // Delete existing predictions if editing
      if (userPredictionCount > 0) {
        const { error: deleteError } = await supabase
          .from('predictions')
          .delete()
          .eq('group_id', groupId)
          .eq('username', user.username)

        if (deleteError) throw deleteError
      }

      // Insert predictions
      const { error: submitError } = await supabase
        .from('predictions')
        .insert(
          predictions
            .filter(p => p.trim())
            .map(content => ({
              group_id: groupId,
              content: content.trim(),
              username: user.username
            }))
        )

      if (submitError) throw submitError

      // Check if all members have submitted
      const { data: members } = await supabase
        .from('group_members')
        .select('username')
        .eq('group_id', groupId)

      const { data: submissions } = await supabase
        .from('predictions')
        .select('username')
        .eq('group_id', groupId)

      const uniqueSubmitters = new Set(submissions.map(s => s.username))
      const allMembersSubmitted = members.every(m => uniqueSubmitters.has(m.username))

      // If all members have submitted, move directly to active phase
      if (allMembersSubmitted) {
        const { error: updateError } = await supabase
          .from('groups')
          .update({ status: 'active' })
          .eq('id', groupId)

        if (updateError) throw updateError
      }

      // Refresh the predictions list
      await checkGroupAndPredictions()
      setHasSubmitted(true)
      setSubmitting(false)
    } catch (err) {
      console.error('Submission error:', err)
      setError('Failed to submit predictions')
      setSubmitting(false)
    }
  }

  const handleEditMode = () => {
    setHasSubmitted(false)
    // Load user's existing predictions into the form
    setPredictions(allPredictions
      .filter(p => p.isCurrentUser)
      .map(p => p.content)
    )
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
        <Breadcrumbs group={group} />
        
        <div className="text-center bg-white border-4 border-double border-blue-500 shadow-lg p-6 rounded-lg">
          <div className="animate-pulse">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-transparent bg-clip-text">
            {hasSubmitted ? 'Review Predictions' : 'Submit Your Predictions'}
          </h2>
          {group && (
            <p className="mt-2 font-bold tracking-widest text-blue-600">
              for {group.name}
            </p>
          )}
          <div className="animate-pulse mt-2">
            <span className="text-red-500">★</span>
            <span className="text-yellow-500">★</span>
            <span className="text-green-500">★</span>
          </div>
        </div>

        {!hasSubmitted ? (
          <div className="mt-8 bg-white border-4 border-double border-emerald-500 shadow-lg rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Guidelines */}
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-2">Guidelines</h3>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Submit 3-5 predictions</li>
                  <li>Each prediction should be clear and verifiable</li>
                  <li>Can be personal to the group or about world events</li>
                  <li>Mix of realistic and wild predictions encouraged</li>
                  <li>Keep each prediction under 280 characters</li>
                </ul>
              </div>

              {error && (
                <div className="mb-6 border-2 border-red-500 bg-red-100 p-4 animate-pulse rounded-md">
                  <div className="text-sm text-red-700 font-bold blink">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {predictions.map((prediction, index) => (
                  <div key={index} className="relative transform hover:scale-102 transition-transform">
                    <textarea
                      value={prediction}
                      onChange={(e) => handlePredictionChange(index, e.target.value)}
                      placeholder="Enter your prediction..."
                      rows={3}
                      className="block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm 
                        border-2 border-indigo-200 rounded-md bg-gradient-to-br from-white to-indigo-50
                        hover:border-indigo-300 transition-colors cursor-retro"
                      maxLength={280}
                      disabled={submitting}
                    />
                    {predictions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePrediction(index)}
                        className="absolute top-0 right-0 p-2 text-gray-400 hover:text-red-500 cursor-retro"
                        disabled={submitting}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <div className="mt-1 text-right text-sm text-gray-500">
                      {prediction.length}/280
                    </div>
                  </div>
                ))}

                {predictions.length < 5 - userPredictionCount && (
                  <button
                    type="button"
                    onClick={handleAddPrediction}
                    disabled={submitting}
                    className="w-full py-2 px-4 border-2 border-dashed border-indigo-300 rounded-md shadow-sm 
                      text-sm font-medium text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                      transition-colors cursor-retro"
                  >
                    ✨ Add Another Prediction ✨
                  </button>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/group/${groupId}`)}
                    disabled={submitting}
                    className="py-2 px-4 border-2 border-gray-300 rounded-md shadow-sm text-sm font-medium 
                      text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                      focus:ring-indigo-500 cursor-retro"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || predictions.every(p => !p.trim())}
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
                        Submitting...
                      </span>
                    ) : (
                      '✨ Submit Predictions ✨'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Show submitted predictions */}
            <div className="bg-white border-4 border-double border-violet-500 shadow-lg rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-transparent bg-clip-text mb-4">
                  Submitted Predictions
                </h3>
                <div className="space-y-4">
                  {allPredictions.map((prediction, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-violet-50 rounded-lg p-4 border-2 border-violet-200
                      transform hover:scale-102 transition-transform">
                      <p className="text-sm text-gray-900">{prediction.content}</p>
                      <p className="mt-1 text-xs font-medium bg-gradient-to-r from-violet-600 to-purple-600 text-transparent bg-clip-text">
                        {prediction.isCurrentUser ? '✨ Your prediction' : `Member ${prediction.username.slice(0, 8)}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleEditMode}
                className="py-2 px-4 border-2 border-violet-300 rounded-md shadow-sm text-sm font-medium 
                  text-violet-700 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-violet-500 cursor-retro"
              >
                ✏️ Edit Your Predictions
              </button>
              <button
                type="button"
                onClick={() => navigate(`/group/${groupId}/card`)}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-gradient-to-r from-violet-500 to-purple-600 
                  hover:from-violet-600 hover:to-purple-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-violet-500 cursor-retro"
              >
                Preview Bingo Board
              </button>
              <button
                type="button"
                onClick={() => navigate(`/group/${groupId}`)}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                  text-white bg-gradient-to-r from-violet-500 to-purple-600 
                  hover:from-violet-600 hover:to-purple-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-violet-500 cursor-retro"
              >
                Back to Group
              </button>
            </div>

            {/* Group Progress */}
            <div className="bg-white border-4 border-double border-amber-500 shadow-lg rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text mb-4">
                  Group Progress
                </h3>
                {allPredictions.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group predictions by submitter */}
                    {Object.entries(
                      allPredictions.reduce((acc, pred) => {
                        if (!acc[pred.username]) acc[pred.username] = [];
                        acc[pred.username].push(pred);
                        return acc;
                      }, {})
                    ).map(([username, predictions]) => (
                      <div key={username} className="bg-gradient-to-br from-gray-50 to-amber-50 rounded-lg p-4 border-2 border-amber-200">
                        <p className="text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text mb-2">
                          {username === user.username ? '✨ Your predictions' : `${username}'s predictions`}
                        </p>
                        <div className="space-y-2">
                          {predictions.map((prediction, idx) => (
                            <p key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-amber-200">
                              {prediction.content}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No predictions submitted yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Marquee */}
        <div className="mt-8 overflow-hidden">
          <div className="text-center font-bold text-blue-600 animate-marquee whitespace-nowrap">
            ⭐ MAKE YOUR PREDICTIONS! ⭐ BE CREATIVE! ⭐ HAVE FUN! ⭐
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubmitPrediction 