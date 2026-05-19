import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { getModules, getProgress, getAchievements } from '../services/api'
import { usePoints } from '../context/PointsContext'
import lessonsIcon from '../assets/lessons-completed.png'
import trophyIcon from '../assets/trophy.png'
import thunderIcon from '../assets/thunder.png'
import rewardIcon from '../assets/reward.png'
import checkIcon from '../assets/check.png'

export default function Dashboard() {
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getModules(), getProgress(), getAchievements()])
      .then(([m, p, a]) => { setModules(m); setProgress(p); setAchievements(a) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completedIds = new Set(progress.filter(p => p.lessonCompleted).map(p => p.moduleId))
  const lessonsCompleted = completedIds.size
  const totalLessons = modules.length || 6
  const progressPct = Math.round((lessonsCompleted / totalLessons) * 100)

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const { points: totalPoints } = usePoints()
  const suggested = modules.filter(m => !completedIds.has(m.id)).slice(0, 3)

  if (loading) return <Layout><p>Loading...</p></Layout>

  return (
    <Layout>
      {/* Welcome Bar */}
      <div className="welcome-bar">
        <h2>Welcome Back! 👋</h2>
        <p className="welcome-sub">Let's continue your crypto learning journey</p>
        <p className="progress-label">Overall Progress <span>{progressPct}%</span></p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <img src={lessonsIcon} alt="" className="stat-icon" />
          <p className="stat-label">Lessons Completed</p>
          <p className="stat-value">{lessonsCompleted}</p>
        </div>
        <div className="stat-card">
          <img src={trophyIcon} alt="" className="stat-icon" />
          <p className="stat-label">Total Points</p>
          <p className="stat-value">{totalPoints}</p>
        </div>
        <div className="stat-card">
          <img src={thunderIcon} alt="" className="stat-icon" />
          <p className="stat-label">Current Streaks</p>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <img src={rewardIcon} alt="" className="stat-icon" />
          <p className="stat-label">Achievements</p>
          <p className="stat-value">{unlockedAchievements.length}/{achievements.length}</p>
        </div>
      </div>

      {/* Suggested Lessons */}
      <div className="section-header">
        <h3>Suggested Lessons</h3>
        <Link to="/lessons" className="view-all">View All →</Link>
      </div>
      <div className="suggested-lessons">
        {suggested.map(lesson => (
          <Link to={`/lessons/${lesson.id}`} key={lesson.id} className="lesson-card-sm">
            <div className="card-top">
              <span className={`difficulty-badge ${lesson.difficulty}`}>{lesson.difficulty}</span>
              <span className="card-time">{lesson.duration}</span>
            </div>
            <p className="card-title">{lesson.title}</p>
            <p className="card-desc">{lesson.description}</p>
            <div className="card-bottom">
              <span className="card-category">{lesson.category}</span>
              <span className="card-points">+{lesson.rewardPoints}</span>
            </div>
          </Link>
        ))}
        {suggested.length === 0 && <p>All lessons completed! Great job!</p>}
      </div>

      {/* Recent Achievements */}
      <div className="section-header">
        <h3>Recent Achievements</h3>
      </div>
      <div className="achievements-grid">
        {unlockedAchievements.slice(0, 3).map((a, i) => (
          <div key={i} className="achievement-card">
            <div className="achievement-emoji">{a.icon}</div>
            <p className="achievement-title">{a.title}</p>
            <p className="achievement-desc">{a.description}</p>
            <div className="achievement-bottom">
              <span className="achievement-pts">+{a.rewardPoints} pts</span>
              <span className="achievement-status">
                <img src={checkIcon} alt="" /> Unlocked
              </span>
            </div>
          </div>
        ))}
        {unlockedAchievements.length === 0 && (
          <div className="achievement-card">
            <div className="achievement-emoji">🎯</div>
            <p className="achievement-title">Start Learning!</p>
            <p className="achievement-desc">Complete your first lesson to unlock achievements</p>
          </div>
        )}
      </div>

      {/* Did You Know */}
      <div className="tip-box">
        <h4>💡 Did you know?</h4>
        <p>
          Maintaining a daily learning streak boosts your retention! Try to complete at least one
          lesson per day to build consistency and earn streak achievements.
        </p>
      </div>

      {/* Trading Simulator CTA */}
      <div className="simulator-cta">
        <div className="cta-emoji">📈</div>
        <h4>Try the Trading Simulator</h4>
        <p>
          Practice buying and selling crypto with $10,000 virtual money. Learn trading strategies
          in a risk-free environment!
        </p>
        <span className="bitcoin-watermark">₿</span>
        <Link to="/simulator" className="cta-btn">Start Trading →</Link>
      </div>
    </Layout>
  )
}
