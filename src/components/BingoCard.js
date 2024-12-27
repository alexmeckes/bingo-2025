import { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'
import Breadcrumbs from './Breadcrumbs'

function BingoCard() {
  const { groupId } = useParams()
  const { user, supabase } = useContext(AuthContext)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [bingoGrid, setBingoGrid] = useState(null)
  const [completedPredictions, setCompletedPredictions] = useState(new Set())
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadCardData()
  }, [groupId])

  const loadCardData = async () => {
    if (!groupId) {
      setError('Invalid group')
      setLoading(false)
      return
    }

    try {
      // Get group details, predictions, and completed predictions
      const [groupResponse, predictionsResponse, completedResponse] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single(),
        supabase
          .from('predictions')
          .select('*')
          .eq('group_id', groupId),
        supabase
          .from('completed_predictions')
          .select('prediction_id')
          .eq('group_id', groupId)
      ])

      if (groupResponse.error) throw groupResponse.error
      if (predictionsResponse.error) throw predictionsResponse.error
      if (completedResponse.error) throw completedResponse.error

      const groupData = groupResponse.data
      const predictions = predictionsResponse.data
      const completed = new Set(completedResponse.data.map(cp => cp.prediction_id))

      // Generate bingo grid with completed predictions
      const grid = generateBingoGrid(predictions, completed)

      setGroup(groupData)
      setPredictions(predictions)
      setCompletedPredictions(completed)
      setBingoGrid(grid)
      setLoading(false)
    } catch (err) {
      console.error('Error loading bingo card:', err)
      setError('Failed to load bingo card')
      setLoading(false)
    }
  }

  const generateBingoGrid = (predictions, completed) => {
    // If we don't have enough predictions, fill with placeholders
    const items = [...predictions]
    while (items.length < 24) {
      items.push({ content: 'TBD', placeholder: true })
    }

    // Get unique submitters and assign them colors
    const submitters = [...new Set(items.filter(p => !p.placeholder).map(p => p.username))]
    const colors = [
      'indigo', 'emerald', 'amber', 'rose', 'violet', 
      'cyan', 'fuchsia', 'lime', 'orange', 'teal',
      'blue', 'green', 'yellow', 'red', 'purple',
      'sky', 'pink', 'slate', 'stone', 'neutral'
    ]

    // Create a deterministic color mapping for each user
    const submitterColors = {}
    submitters.forEach((submitter, index) => {
      const hash = submitter.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const colorIndex = hash % colors.length
      let finalColorIndex = colorIndex
      while (Object.values(submitterColors).includes(colors[finalColorIndex])) {
        finalColorIndex = (finalColorIndex + 1) % colors.length
      }
      submitterColors[submitter] = colors[finalColorIndex]
    })

    // Shuffle predictions and select 24 (leaving center as FREE)
    const shuffled = items.sort(() => Math.random() - 0.5).slice(0, 24)
    
    // Create 5x5 grid with FREE space in center
    const grid = []
    let predIndex = 0
    
    for (let i = 0; i < 25; i++) {
      if (i === 12) { // Center space
        grid.push({ type: 'free', content: 'FREE', completed: true })
      } else {
        const prediction = shuffled[predIndex]
        grid.push({
          type: 'prediction',
          id: prediction.id,
          content: prediction.content,
          completed: completed.has(prediction.id),
          placeholder: prediction.placeholder,
          username: prediction.username,
          color: prediction.placeholder ? null : submitterColors[prediction.username]
        })
        predIndex++
      }
    }

    return grid
  }

  const handlePredictionClick = async (index) => {
    if (!bingoGrid || updating) return
    const cell = bingoGrid[index]
    if (cell.type === 'free' || cell.placeholder) return

    setUpdating(true)
    try {
      const newCompleted = new Set(completedPredictions)
      if (newCompleted.has(cell.id)) {
        // Remove completion
        await supabase
          .from('completed_predictions')
          .delete()
          .eq('prediction_id', cell.id)
          .eq('group_id', groupId)
        newCompleted.delete(cell.id)
      } else {
        // Add completion
        await supabase
          .from('completed_predictions')
          .insert([{
            prediction_id: cell.id,
            group_id: groupId,
            completed_by: user.username
          }])
        newCompleted.add(cell.id)
      }

      // Update local state
      setCompletedPredictions(newCompleted)
      const newGrid = [...bingoGrid]
      newGrid[index] = { ...cell, completed: !cell.completed }
      setBingoGrid(newGrid)
    } catch (err) {
      console.error('Error updating prediction:', err)
      setError('Failed to update prediction')
    } finally {
      setUpdating(false)
    }
  }

  const getColorClasses = (color) => {
    const colorMap = {
      indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-500',
      emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-500',
      amber: 'bg-amber-50 border-amber-200 hover:border-amber-500',
      rose: 'bg-rose-50 border-rose-200 hover:border-rose-500',
      violet: 'bg-violet-50 border-violet-200 hover:border-violet-500',
      cyan: 'bg-cyan-50 border-cyan-200 hover:border-cyan-500',
      fuchsia: 'bg-fuchsia-50 border-fuchsia-200 hover:border-fuchsia-500',
      lime: 'bg-lime-50 border-lime-200 hover:border-lime-500',
      orange: 'bg-orange-50 border-orange-200 hover:border-orange-500',
      teal: 'bg-teal-50 border-teal-200 hover:border-teal-500',
      blue: 'bg-blue-50 border-blue-200 hover:border-blue-500',
      green: 'bg-green-50 border-green-200 hover:border-green-500',
      yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-500',
      red: 'bg-red-50 border-red-200 hover:border-red-500',
      purple: 'bg-purple-50 border-purple-200 hover:border-purple-500',
      sky: 'bg-sky-50 border-sky-200 hover:border-sky-500',
      pink: 'bg-pink-50 border-pink-200 hover:border-pink-500',
      slate: 'bg-slate-50 border-slate-200 hover:border-slate-500',
      stone: 'bg-stone-50 border-stone-200 hover:border-stone-500',
      neutral: 'bg-neutral-50 border-neutral-200 hover:border-neutral-500'
    }
    return colorMap[color] || ''
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
            {group?.name || 'Loading...'}
          </h2>
          <div className="mt-2 font-bold tracking-widest text-blue-600 animate-bounce">
            ⭐ BINGO ⭐
          </div>
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

        {bingoGrid && (
          <div className="mt-8 bg-white border-4 border-double border-purple-500 p-6 rounded-lg shadow-lg">
            <div className="grid grid-cols-5 gap-2">
              {bingoGrid.map((cell, index) => (
                <div
                  key={index}
                  onClick={() => handlePredictionClick(index)}
                  className={`
                    aspect-square p-2 rounded-lg text-sm flex items-center justify-center text-center relative
                    transform transition-transform hover:scale-105 hover:shadow-xl cursor-retro
                    ${cell.type === 'free' 
                      ? 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold animate-pulse'
                      : cell.placeholder
                        ? 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                        : cell.completed
                          ? 'bg-gradient-to-br from-green-300 to-green-500 text-white'
                          : getColorClasses(cell.color)
                    }
                    ${!cell.placeholder && cell.type !== 'free' ? 'border-2' : ''}
                  `}
                >
                  {cell.content}
                  {!cell.placeholder && cell.type !== 'free' && (
                    <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${getDotColor(cell.color)}`} />
                  )}
                  {cell.completed && cell.type !== 'free' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                      <span className="text-2xl">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 overflow-hidden">
              <div className="text-center font-bold text-blue-600 animate-marquee whitespace-nowrap">
                ⭐ CLICK A SQUARE WHEN THE PREDICTION COMES TRUE! ⭐ GOOD LUCK! ⭐ HAVE FUN! ⭐
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BingoCard 