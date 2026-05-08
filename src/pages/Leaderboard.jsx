import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getLeaderboard } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Leaderboard() {
  const [data, setData] = useState({ leaderboard: [], currentUser: null })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    getLeaderboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><p>Loading...</p></Layout>

  const medals = ['🏆', '🥈', '🥉']
  const myRank = data.currentUser?.rank || '-'
  const myPoints = data.currentUser?.points || 0

  return (
    <Layout>
      {/* Rank Banner */}
      <div className="lb-banner">
        <div className="lb-banner-content">
          <p className="lb-banner-label">Your Current Rank</p>
          <div className="lb-banner-rank">#{myRank}</div>
          <p className="lb-banner-points">{myPoints.toLocaleString()} Points</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="lb-table-wrapper">
        <table className="lb-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Points</th>
              <th>Streak</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((u) => {
              const isYou = u.userId === user?.uid
              return (
                <tr key={u.rank} className={isYou ? 'lb-row-you' : ''}>
                  <td className="lb-rank">
                    {u.rank <= 3 ? (
                      <span className="lb-medal">{medals[u.rank - 1]}</span>
                    ) : (
                      <span className="lb-rank-num">{u.rank}</span>
                    )}
                  </td>
                  <td className="lb-user">
                    <div className="lb-avatar">
                      {u.profilePicture ? (
                        <img src={u.profilePicture} alt="" className="avatar-img" />
                      ) : (
                        u.name.charAt(0)
                      )}
                    </div>
                    <span>{u.name}</span>
                    {isYou && <span className="lb-you-badge">You</span>}
                  </td>
                  <td className="lb-points">🏆 {u.points.toLocaleString()}</td>
                  <td className="lb-streak">🔥 {u.streak}</td>
                  <td className="lb-completed">Lv.{u.level}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Tip Cards */}
      <div className="lb-tips-grid">
        <div className="lb-tip-card lb-tip-yellow">
          <span className="lb-tip-icon">📚</span>
          <h4>Complete More Lessons</h4>
          <p>Each completed lesson earns you points and helps you climb the leaderboard</p>
        </div>
        <div className="lb-tip-card lb-tip-blue">
          <span className="lb-tip-icon">🔥</span>
          <h4>Maintain Your Streak</h4>
          <p>Daily learning streaks show dedication and boost your ranking</p>
        </div>
        <div className="lb-tip-card lb-tip-green">
          <span className="lb-tip-icon">💯</span>
          <h4>Ace Your Quizzes</h4>
          <p>Perfect quiz scores earn bonus points and special achievements</p>
        </div>
      </div>
    </Layout>
  )
}
