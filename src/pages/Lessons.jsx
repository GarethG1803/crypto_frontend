import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { getModules, getProgress } from '../services/api'
import awardIcon from '../assets/award.png'
import checkIcon from '../assets/check.png'

const difficultyFilters = ['All', 'Beginner', 'Intermediate', 'Advanced']
const categoryFilters = ['All', 'Fundamentals', 'Technology', 'Security', 'Advanced Concepts']

function getBgClass(difficulty) {
  if (difficulty === 'beginner') return 'beginner-bg'
  if (difficulty === 'intermediate') return 'intermediate-bg'
  return 'advanced-bg'
}

export default function Lessons() {
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [diffFilter, setDiffFilter] = useState('All')
  const [catFilter, setCatFilter] = useState('All')

  useEffect(() => {
    Promise.all([getModules(), getProgress()])
      .then(([m, p]) => { setModules(m); setProgress(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const progressMap = {}
  progress.forEach(p => { progressMap[p.moduleId] = p })

  const lessons = modules.map(m => {
    const prog = progressMap[m.id]
    return {
      id: m.id,
      title: m.title,
      desc: m.description,
      difficulty: m.difficulty,
      category: m.category,
      time: m.duration,
      points: m.rewardPoints,
      completed: prog?.lessonCompleted || false,
      quizScore: prog?.quizCompleted ? `${Math.round(prog.quizScore / 100 * m.quizQuestionCount)}/${m.quizQuestionCount}` : null,
    }
  })

  const filtered = lessons.filter((l) => {
    const diffMatch = diffFilter === 'All' || l.difficulty === diffFilter.toLowerCase()
    const catMatch = catFilter === 'All' || l.category === catFilter
    return diffMatch && catMatch
  })

  if (loading) return <Layout><p>Loading...</p></Layout>

  return (
    <Layout>
      <div className="lessons-header">
        <h2>Crypto Lessons</h2>
        <p>Choose a lesson to start learning and earning points</p>
      </div>

      <div className="filter-section">
        <p className="filter-label">Difficulty</p>
        <div className="filter-pills">
          {difficultyFilters.map((f) => (
            <button
              key={f}
              className={`filter-pill ${diffFilter === f ? 'active' : ''}`}
              onClick={() => setDiffFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <p className="filter-label">Category</p>
        <div className="filter-pills">
          {categoryFilters.map((f) => (
            <button
              key={f}
              className={`filter-pill ${catFilter === f ? 'active' : ''}`}
              onClick={() => setCatFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="lessons-grid">
        {filtered.map((lesson) => (
          <Link to={`/lessons/${lesson.id}`} key={lesson.id} className="lesson-grid-card">
            <div className={`card-header ${getBgClass(lesson.difficulty)}`}>
              <span className={`difficulty-badge ${lesson.difficulty}`}>
                {lesson.difficulty}
              </span>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#000',
                  marginTop: 12,
                  marginBottom: 6,
                }}
              >
                {lesson.title}
              </p>
              <p style={{ fontSize: 11, color: '#000', lineHeight: 1.4 }}>{lesson.desc}</p>
            </div>
            <div className="card-body">
              <div className="card-meta">
                <span className="time">🕓 {lesson.time}</span>
                <span className="points">
                  <img src={awardIcon} alt="" /> +{lesson.points}
                </span>
              </div>
              <p className="card-category">{lesson.category}</p>
              {lesson.quizScore && (
                <p className="card-quiz">
                  Quiz Score: <span>{lesson.quizScore}</span>
                </p>
              )}
              <div className="card-divider" />
              {lesson.completed && (
                <div className="card-status">
                  <img src={checkIcon} alt="" /> Completed
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
