import { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { AuthContext } from '../context/AuthProvider'

function BingoCard() {
  const { groupId } = useParams()
  const { user, supabase } = useContext(AuthContext)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [bingoGrid, setBingoGrid] = useState(null)

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
      // Get group details and predictions
      const [groupResponse, predictionsResponse] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single(),
        supabase
          .from('predictions')
          .select('*')
          .eq('group_id', groupId)
      ])

      if (groupResponse.error) throw groupResponse.error
      if (predictionsResponse.error) throw predictionsResponse.error

      const groupData = groupResponse.data
      const predictions = predictionsResponse.data

      // Generate bingo grid
      const grid = generateBingoGrid(predictions)

      setGroup(groupData)
      setPredictions(predictions)
      setBingoGrid(grid)
      setLoading(false)
    } catch (err) {
      console.error('Error loading bingo card:', err)
      setError('Failed to load bingo card')
      setLoading(false)
    }
  }

  const generateBingoGrid = (predictions) => {
    // If we don't have enough predictions, fill with placeholders
    const items = [...predictions]
    while (items.length < 24) {
      items.push({ content: 'TBD', placeholder: true })
    }

    // Get unique submitters and assign them colors
    const submitters = [...new Set(items.filter(p => !p.placeholder).map(p => p.submitted_by))]
    const colors = [
      'indigo', 'emerald', 'amber', 'rose', 'violet', 
      'cyan', 'fuchsia', 'lime', 'orange', 'teal'
    ]
    const submitterColors = Object.fromEntries(
      submitters.map((submitter, i) => [
        submitter, 
        colors[i % colors.length]
      ])
    )

    // Shuffle predictions and select 24 (leaving center as FREE)
    const shuffled = items.sort(() => Math.random() - 0.5).slice(0, 24)
    
    // Create 5x5 grid with FREE space in center
    const grid = []
    let predIndex = 0
    
    for (let i = 0; i < 25; i++) {
      if (i === 12) { // Center space
        grid.push({ type: 'free', content: 'FREE', completed: false })
      } else {
        const prediction = shuffled[predIndex]
        grid.push({
          type: 'prediction',
          content: prediction.content,
          completed: false,
          placeholder: prediction.placeholder,
          submitted_by: prediction.submitted_by,
          color: prediction.placeholder ? null : submitterColors[prediction.submitted_by]
        })
        predIndex++
      }
    }

    return grid
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
      teal: 'bg-teal-50 border-teal-200 hover:border-teal-500'
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
      teal: 'bg-teal-400'
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
      <div className="max-w-4xl mx-auto">
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
                  `}
                >
                  {cell.content}
                  {!cell.placeholder && cell.type !== 'free' && (
                    <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${getDotColor(cell.color)}`} />
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