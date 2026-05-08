import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminScores, resetAdminProgress } from '../../services/api'

export default function AdminScores() {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminScores()
      .then(setScores)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleReset = async (id, userName, moduleTitle) => {
    if (!confirm(`Reset progress for "${userName}" on "${moduleTitle}"?`)) return
    try {
      await resetAdminProgress(id)
      setScores(scores.filter(s => s.id !== id))
    } catch (err) {
      alert('Failed to reset progress: ' + err.message)
    }
  }

  if (loading) return <AdminLayout><p className="admin-loading">Loading...</p></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Scores</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Module</th>
              <th>Lesson</th>
              <th>Quiz</th>
              <th>Score</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => (
              <tr key={s.id}>
                <td>{s.userName}</td>
                <td>{s.moduleTitle}</td>
                <td>
                  <span className={`admin-badge ${s.lessonCompleted ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                    {s.lessonCompleted ? 'Done' : 'No'}
                  </span>
                </td>
                <td>
                  <span className={`admin-badge ${s.quizCompleted ? 'admin-badge-green' : 'admin-badge-gray'}`}>
                    {s.quizCompleted ? 'Done' : 'No'}
                  </span>
                </td>
                <td>{s.quizScore != null ? `${s.quizScore}%` : '-'}</td>
                <td>{s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '-'}</td>
                <td>
                  <button className="admin-btn admin-btn-delete" onClick={() => handleReset(s.id, s.userName, s.moduleTitle)}>Reset</button>
                </td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr><td colSpan="7" className="admin-empty">No scores found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
