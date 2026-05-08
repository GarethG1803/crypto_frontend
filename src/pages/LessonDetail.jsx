import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getModule, getProgress, completeLesson } from '../services/api'
import trophyIcon from '../assets/trophy-small.png'
import checkmarkIcon from '../assets/checkmark-white.png'

function renderText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function LessonDetail() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentSection, setCurrentSection] = useState(0)

  useEffect(() => {
    Promise.all([getModule(lessonId), getProgress()])
      .then(([mod, progress]) => {
        setLesson(mod)
        const prog = progress.find(p => p.moduleId === lessonId)
        setCompleted(prog?.lessonCompleted || false)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lessonId])

  // Group content blocks into sections split at each heading
  const sections = useMemo(() => {
    if (!lesson?.content?.length) return []
    const result = []
    let current = []
    lesson.content.forEach(block => {
      if (block.type === 'heading' && current.length > 0) {
        result.push(current)
        current = []
      }
      current.push(block)
    })
    if (current.length > 0) result.push(current)
    return result
  }, [lesson])

  if (loading) return <Layout><p>Loading...</p></Layout>

  if (!lesson) {
    return (
      <Layout>
        <p>Lesson not found.</p>
        <Link to="/lessons">Back to Lessons</Link>
      </Layout>
    )
  }

  const totalSections = sections.length
  const isLastSection = currentSection >= totalSections - 1
  const sectionProgress = totalSections > 0
    ? ((currentSection + 1) / totalSections) * 100
    : 100

  const handleNext = () => {
    if (!isLastSection) {
      setCurrentSection(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(s => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleStartQuiz = async () => {
    try {
      await completeLesson(lessonId)
      setCompleted(true)
    } catch {}
    navigate(`/lessons/${lessonId}/quiz`)
  }

  return (
    <Layout>
      <Link to="/lessons" className="back-link">
        ← Back to Lessons
      </Link>

      <div className="lesson-detail-card">
        {/* Banner */}
        <div className="lesson-detail-banner">
          <div className="banner-meta">
            <span className={`difficulty-badge ${lesson.difficulty}`}>{lesson.difficulty}</span>
            <span className="cat">{lesson.category}</span>
            <span className="cat">· {lesson.duration}</span>
          </div>
          <h2>{lesson.title}</h2>
          <p className="banner-desc">{lesson.description}</p>
          <div className="banner-badges">
            <div className="points-badge">
              <img src={trophyIcon} alt="" />
              +{lesson.rewardPoints} points
            </div>
            {completed && (
              <div className="completed-badge">
                <img src={checkmarkIcon} alt="" />
                Completed
              </div>
            )}
          </div>
        </div>

        {/* Section Progress Bar */}
        {totalSections > 1 && (
          <div className="lesson-section-progress">
            <div className="section-progress-header">
              <span className="section-progress-label">
                Section {currentSection + 1} of {totalSections}
              </span>
              <span className="section-progress-pct">{Math.round(sectionProgress)}%</span>
            </div>
            <div className="section-progress-track">
              <div
                className="section-progress-fill"
                style={{ width: `${sectionProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Current Section Content */}
        <div className="lesson-content">
          {(totalSections > 0 ? sections[currentSection] : lesson.content).map((block, i) => {
            if (block.type === 'heading') return <h3 key={i}>{block.text}</h3>
            return <p key={i}>{renderText(block.text)}</p>
          })}
        </div>

        {/* Section Navigation Buttons */}
        <div className="lesson-section-nav">
          {currentSection > 0 ? (
            <button className="section-nav-btn prev" onClick={handlePrev}>
              ← Previous
            </button>
          ) : (
            <div />
          )}

          {!isLastSection ? (
            <button className="section-nav-btn next" onClick={handleNext}>
              Continue →
            </button>
          ) : (
            <button className="section-nav-btn quiz" onClick={handleStartQuiz}>
              Start Quiz ({lesson.quizQuestionCount} Questions) →
            </button>
          )}
        </div>

        {/* Section Dots */}
        {totalSections > 1 && (
          <div className="section-dots">
            {sections.map((_, i) => (
              <button
                key={i}
                className={`section-dot ${i === currentSection ? 'active' : ''} ${i < currentSection ? 'done' : ''}`}
                onClick={() => {
                  setCurrentSection(i)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
