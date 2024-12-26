import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'

function PredictionCell({ prediction }) {
  const { supabase } = useContext(AuthContext)

  const handleMarkCompleted = async () => {
    const { error } = await supabase
      .from('predictions')
      .update({ status: 'completed' })
      .eq('id', prediction.id)

    if (error) {
      console.error('Error updating prediction:', error)
    }
  }

  return (
    <div className={`prediction-cell ${prediction.status}`}>
      <p>{prediction.content}</p>
      {prediction.status === 'completed' ? (
        <span>✅ Completed</span>
      ) : (
        <button onClick={handleMarkCompleted}>Mark as Completed</button>
      )}
    </div>
  )
}

export default PredictionCell 