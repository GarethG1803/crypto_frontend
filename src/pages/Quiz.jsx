import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getQuiz, submitQuiz } from '../services/api'
import { usePoints } from '../context/PointsContext'
import starCircle from '../assets/star-circle.png'
import checkmarkGreen from '../assets/checkmark-green.png'

export default function Quiz() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { addPoints, refreshPoints } = usePoints()

  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState([])
  const [results, setResults] = useState(null)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    getQuiz(lessonId)
      .then(data => setQuestions(data.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lessonId])

  if (loading) return <Layout><p>Loading quiz...</p></Layout>
  if (!questions.length) return <Layout><p>No quiz available.</p></Layout>

  const question = questions[currentQ]
  const totalQ = questions.length
  const progressPct = ((currentQ + (submitted ? 1 : 0)) / totalQ) * 100

  const handleSelect = (idx) => {
    if (submitted) return
    setSelected(idx)
  }

  const handleSubmit = async () => {
    if (selected === null) return
    if (!submitted) {
      setSubmitted(true)
      const newAnswers = [...answers, selected]
      setAnswers(newAnswers)
    } else {
      if (currentQ < totalQ - 1) {
        setCurrentQ((q) => q + 1)
        setSelected(null)
        setSubmitted(false)
      } else {
        try {
          const res = await submitQuiz(lessonId, answers)
          setResults(res)
          // Award earned points to global context
          if (res?.earnedPoints) {
            addPoints(res.earnedPoints)
          }
          // Refresh to sync with backend totals
          refreshPoints()
        } catch {}
        setFinished(true)
      }
    }
  }

  const handleRetake = () => {
    setCurrentQ(0)
    setSelected(null)
    setSubmitted(false)
    setAnswers([])
    setResults(null)
    setFinished(false)
  }

  if (finished) {
    const correct = results?.correct ?? 0
    const total = results?.total ?? totalQ
    const pct = results?.score ?? Math.round((correct / total) * 100)
    const earned = results?.earnedPoints ?? 0

    return (
      <Layout>
        <div className="quiz-results">
          <img src={starCircle} alt="" className="results-icon" />
          <h2>Quiz Completed!</h2>
          <p className="results-sub">
            {earned > 0
              ? `You earned ${earned} points!`
              : 'Great effort! Keep learning to improve your score'}
          </p>
          <div className="score-box">
            <p className="score-num">{correct}/{total}</p>
            <p className="score-pct">{pct}% Correct</p>
          </div>

          {earned > 0 && (
            <div className="earned-points-display">
              <span className="earned-points-icon">+{earned}</span>
              <span className="earned-points-text">Points Earned</span>
            </div>
          )}

          {results?.newAchievements?.length > 0 && (
            <div className="new-achievements">
              {results.newAchievements.map((a, i) => (
                <p key={i}>{a.icon} {a.title} unlocked!</p>
              ))}
            </div>
          )}
          <div className="results-actions">
            <button className="retake-btn" onClick={handleRetake}>
              Retake Quiz
            </button>
            <button className="back-btn" onClick={() => navigate('/lessons')}>
              Back to Lessons
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="quiz-header">
        <span className="question-count">
          Question {currentQ + 1} of {totalQ}
        </span>
        <span className="correct-count">{answers.length} Answered</span>
      </div>
      <div className="quiz-progress">
        <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="quiz-card">
        <p className="quiz-question">{question.question}</p>

        <div className="quiz-options">
          {question.options.map((opt, idx) => {
            let className = 'quiz-option'
            if (submitted && idx === selected) className += ' selected'
            else if (idx === selected) className += ' selected'
            return (
              <div key={idx} className={className} onClick={() => handleSelect(idx)}>
                <span>{opt}</span>
              </div>
            )
          })}
        </div>

        <button
          className={`quiz-submit-btn ${selected !== null || submitted ? 'active' : 'disabled'}`}
          onClick={handleSubmit}
          disabled={selected === null && !submitted}
        >
          {submitted
            ? currentQ < totalQ - 1
              ? 'Next Question'
              : 'See Results'
            : 'Submit Answer'}
        </button>
      </div>
    </Layout>
  )
}
