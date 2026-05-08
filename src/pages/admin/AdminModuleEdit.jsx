import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAdminModules, updateAdminModuleContent, getAdminModuleQuiz, saveAdminModuleQuiz } from '../../services/api'

const emptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
})

export default function AdminModuleEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [moduleName, setModuleName] = useState('')
  const [content, setContent] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingContent, setSavingContent] = useState(false)
  const [savingQuiz, setSavingQuiz] = useState(false)
  const [tab, setTab] = useState('content')

  useEffect(() => {
    Promise.all([getAdminModules(), getAdminModuleQuiz(id)])
      .then(([modules, quiz]) => {
        const mod = modules.find(m => m.id === id)
        if (mod) {
          setModuleName(mod.title)
          setContent(mod.content || [])
        }
        setQuestions(quiz.questions || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // --- Content helpers ---
  const addBlock = (type) => {
    setContent([...content, { type, text: '' }])
  }

  const updateBlock = (index, text) => {
    setContent(content.map((b, i) => i === index ? { ...b, text } : b))
  }

  const removeBlock = (index) => {
    setContent(content.filter((_, i) => i !== index))
  }

  const moveBlock = (index, dir) => {
    const newArr = [...content]
    const target = index + dir
    if (target < 0 || target >= newArr.length) return
    ;[newArr[index], newArr[target]] = [newArr[target], newArr[index]]
    setContent(newArr)
  }

  const handleSaveContent = async () => {
    setSavingContent(true)
    try {
      await updateAdminModuleContent(id, content)
      alert('Lesson content saved!')
    } catch (err) {
      alert('Failed to save content: ' + err.message)
    } finally {
      setSavingContent(false)
    }
  }

  // --- Quiz helpers ---
  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()])
  }

  const updateQuestion = (qi, field, value) => {
    setQuestions(questions.map((q, i) => i === qi ? { ...q, [field]: value } : q))
  }

  const updateOption = (qi, oi, value) => {
    setQuestions(questions.map((q, i) => {
      if (i !== qi) return q
      const options = [...q.options]
      options[oi] = value
      return { ...q, options }
    }))
  }

  const removeQuestion = (qi) => {
    setQuestions(questions.filter((_, i) => i !== qi))
  }

  const handleSaveQuiz = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) {
        alert(`Question ${i + 1} text is empty`)
        return
      }
      if (q.options.some(o => !o.trim())) {
        alert(`Question ${i + 1} has empty options`)
        return
      }
    }
    setSavingQuiz(true)
    try {
      await saveAdminModuleQuiz(id, questions)
      alert('Quiz saved!')
    } catch (err) {
      alert('Failed to save quiz: ' + err.message)
    } finally {
      setSavingQuiz(false)
    }
  }

  if (loading) return <AdminLayout><p className="admin-loading">Loading...</p></AdminLayout>

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <button className="admin-btn admin-btn-cancel" onClick={() => navigate('/admin/modules')} style={{ marginBottom: 8 }}>
            &larr; Back to Modules
          </button>
          <h1 className="admin-page-title">{moduleName || id}</h1>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'content' ? 'active' : ''}`} onClick={() => setTab('content')}>
          Lesson Content ({content.length} blocks)
        </button>
        <button className={`admin-tab ${tab === 'quiz' ? 'active' : ''}`} onClick={() => setTab('quiz')}>
          Quiz Questions ({questions.length})
        </button>
      </div>

      {tab === 'content' && (
        <div className="admin-editor-section">
          <div className="admin-editor-toolbar">
            <button className="admin-btn admin-btn-edit" onClick={() => addBlock('heading')}>+ Heading</button>
            <button className="admin-btn admin-btn-edit" onClick={() => addBlock('paragraph')}>+ Paragraph</button>
            <button className="admin-btn admin-btn-save" onClick={handleSaveContent} disabled={savingContent}>
              {savingContent ? 'Saving...' : 'Save Content'}
            </button>
          </div>

          {content.length === 0 && (
            <p className="admin-empty" style={{ padding: '32px 0' }}>No content yet. Add headings and paragraphs above.</p>
          )}

          {content.map((block, i) => (
            <div key={i} className="admin-content-block">
              <div className="admin-content-block-header">
                <span className="admin-content-block-type">{block.type}</span>
                <div className="admin-action-group">
                  <button className="admin-btn admin-btn-cancel" onClick={() => moveBlock(i, -1)} disabled={i === 0}>&uarr;</button>
                  <button className="admin-btn admin-btn-cancel" onClick={() => moveBlock(i, 1)} disabled={i === content.length - 1}>&darr;</button>
                  <button className="admin-btn admin-btn-delete" onClick={() => removeBlock(i)}>Remove</button>
                </div>
              </div>
              {block.type === 'heading' ? (
                <input
                  className="admin-content-input admin-content-heading"
                  value={block.text}
                  onChange={(e) => updateBlock(i, e.target.value)}
                  placeholder="Heading text..."
                />
              ) : (
                <textarea
                  className="admin-content-input"
                  rows={3}
                  value={block.text}
                  onChange={(e) => updateBlock(i, e.target.value)}
                  placeholder="Paragraph text..."
                />
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'quiz' && (
        <div className="admin-editor-section">
          <div className="admin-editor-toolbar">
            <button className="admin-btn admin-btn-edit" onClick={addQuestion}>+ Add Question</button>
            <button className="admin-btn admin-btn-save" onClick={handleSaveQuiz} disabled={savingQuiz}>
              {savingQuiz ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>

          {questions.length === 0 && (
            <p className="admin-empty" style={{ padding: '32px 0' }}>No quiz questions yet. Add one above.</p>
          )}

          {questions.map((q, qi) => (
            <div key={qi} className="admin-quiz-card">
              <div className="admin-quiz-card-header">
                <span className="admin-quiz-card-num">Q{qi + 1}</span>
                <button className="admin-btn admin-btn-delete" onClick={() => removeQuestion(qi)}>Remove</button>
              </div>

              <div className="admin-form-field">
                <label>Question</label>
                <input
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                  placeholder="Enter the question..."
                />
              </div>

              <div className="admin-quiz-options">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="admin-quiz-option">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctAnswer === oi}
                      onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                      title="Mark as correct answer"
                    />
                    <input
                      className="admin-quiz-option-input"
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                    />
                    {q.correctAnswer === oi && <span className="admin-quiz-correct-label">Correct</span>}
                  </div>
                ))}
              </div>

              <div className="admin-form-field">
                <label>Explanation</label>
                <textarea
                  rows={2}
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)}
                  placeholder="Explain the correct answer..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
