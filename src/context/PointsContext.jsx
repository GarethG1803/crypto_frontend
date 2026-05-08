import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getAchievements } from '../services/api'

const PointsContext = createContext(null)

export function PointsProvider({ children }) {
  const [points, setPoints] = useState(() => {
    return parseInt(localStorage.getItem('totalPoints') || '0', 10)
  })
  const [animation, setAnimation] = useState(null)

  const refreshPoints = useCallback(async () => {
    try {
      const achievements = await getAchievements()
      const total = achievements
        .filter(a => a.unlocked)
        .reduce((sum, a) => sum + (a.rewardPoints || 0), 0)
      setPoints(total)
      localStorage.setItem('totalPoints', String(total))
    } catch {
      // keep cached localStorage value
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) refreshPoints()
  }, [refreshPoints])

  const addPoints = useCallback((amount) => {
    if (!amount || amount <= 0) return
    setPoints(prev => {
      const next = prev + amount
      localStorage.setItem('totalPoints', String(next))
      return next
    })
    setAnimation(amount)
    setTimeout(() => setAnimation(null), 2500)
  }, [])

  return (
    <PointsContext.Provider value={{ points, addPoints, refreshPoints, animation }}>
      {children}
    </PointsContext.Provider>
  )
}

export const usePoints = () => useContext(PointsContext)
