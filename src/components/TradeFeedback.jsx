import { useState } from 'react'

export default function TradeFeedback({ feedback, onClose }) {
  const [conceptOpen, setConceptOpen] = useState(false)

  if (!feedback) return null

  return (
    <div className="sim-feedback-overlay" onClick={onClose}>
      <div className="sim-feedback-card" onClick={e => e.stopPropagation()}>
        <div className="sim-feedback-header">
          <h3>Trade Analysis</h3>
        </div>

        <p className="sim-feedback-text">{feedback.feedback}</p>

        {feedback.tips && feedback.tips.length > 0 && (
          <div className="sim-feedback-tips">
            <h4>Tips</h4>
            <ul>
              {feedback.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {feedback.concept && (
          <div className="sim-feedback-concept">
            <button
              className="sim-feedback-concept-toggle"
              onClick={() => setConceptOpen(!conceptOpen)}
            >
              Learn: {feedback.concept} {conceptOpen ? '▲' : '▼'}
            </button>
            {conceptOpen && (
              <p className="sim-feedback-concept-text">{feedback.conceptExplanation}</p>
            )}
          </div>
        )}

        <button className="sim-feedback-dismiss" onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  )
}
