import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAdminModules, createAdminModule, updateAdminModule, deleteAdminModule } from '../../services/api'

const emptyForm = {
  title: '',
  description: '',
  difficulty: 'beginner',
  category: '',
  duration: '',
  rewardPoints: 100,
  order: 0,
}

export default function AdminModules() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [addFields, setAddFields] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getAdminModules()
      .then(setModules)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (m) => {
    setEditingId(m.id)
    setEditFields({
      order: m.order ?? 0,
      title: m.title || '',
      difficulty: m.difficulty || 'Beginner',
      duration: m.duration || '',
      rewardPoints: m.rewardPoints ?? 100,
      description: m.description || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFields({})
  }

  const saveEdit = async (id) => {
    try {
      await updateAdminModule(id, editFields)
      setModules(modules.map(m => m.id === id ? { ...m, ...editFields } : m))
      setEditingId(null)
    } catch (err) {
      alert('Failed to update module: ' + err.message)
    }
  }

  const handleAdd = async () => {
    if (!addFields.title.trim()) {
      alert('Title is required')
      return
    }
    setSaving(true)
    try {
      const created = await createAdminModule(addFields)
      setModules([...modules, { ...created, completions: 0 }])
      setAddFields({ ...emptyForm })
      setShowAdd(false)
    } catch (err) {
      alert('Failed to create module: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete module "${title || id}"? This will also remove related quizzes and progress. This cannot be undone.`)) return
    try {
      await deleteAdminModule(id)
      setModules(modules.filter(m => m.id !== id))
    } catch (err) {
      alert('Failed to delete module: ' + err.message)
    }
  }

  if (loading) return <AdminLayout><p className="admin-loading">Loading...</p></AdminLayout>

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Modules</h1>
        <button className="admin-btn admin-btn-add" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add Module'}
        </button>
      </div>

      {showAdd && (
        <div className="admin-add-form">
          <h3 className="admin-add-form-title">New Module</h3>
          <div className="admin-add-form-grid">
            <div className="admin-form-field">
              <label>Title *</label>
              <input value={addFields.title} onChange={(e) => setAddFields({ ...addFields, title: e.target.value })} placeholder="e.g. Understanding DeFi" />
            </div>
            <div className="admin-form-field">
              <label>Category</label>
              <input value={addFields.category} onChange={(e) => setAddFields({ ...addFields, category: e.target.value })} placeholder="e.g. Fundamentals" />
            </div>
            <div className="admin-form-field">
              <label>Difficulty</label>
              <select value={addFields.difficulty} onChange={(e) => setAddFields({ ...addFields, difficulty: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="admin-form-field">
              <label>Duration</label>
              <input value={addFields.duration} onChange={(e) => setAddFields({ ...addFields, duration: e.target.value })} placeholder="e.g. 15 min" />
            </div>
            <div className="admin-form-field">
              <label>Reward Points</label>
              <input type="number" value={addFields.rewardPoints} onChange={(e) => setAddFields({ ...addFields, rewardPoints: Number(e.target.value) })} />
            </div>
            <div className="admin-form-field">
              <label>Order</label>
              <input type="number" value={addFields.order} onChange={(e) => setAddFields({ ...addFields, order: Number(e.target.value) })} />
            </div>
            <div className="admin-form-field admin-form-field-full">
              <label>Description</label>
              <textarea rows="2" value={addFields.description} onChange={(e) => setAddFields({ ...addFields, description: e.target.value })} placeholder="Short description of this module" />
            </div>
          </div>
          <div className="admin-add-form-actions">
            <button className="admin-btn admin-btn-save" onClick={handleAdd} disabled={saving}>
              {saving ? 'Creating...' : 'Create Module'}
            </button>
            <button className="admin-btn admin-btn-cancel" onClick={() => { setShowAdd(false); setAddFields({ ...emptyForm }) }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Reward Pts</th>
              <th>Completions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.id}>
                <td>
                  {editingId === m.id ? (
                    <input className="admin-inline-input admin-inline-sm" type="number" value={editFields.order} onChange={(e) => setEditFields({ ...editFields, order: Number(e.target.value) })} />
                  ) : (m.order ?? '-')}
                </td>
                <td>
                  {editingId === m.id ? (
                    <input className="admin-inline-input" value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />
                  ) : (m.title || '-')}
                </td>
                <td>
                  {editingId === m.id ? (
                    <select className="admin-inline-input" value={editFields.difficulty} onChange={(e) => setEditFields({ ...editFields, difficulty: e.target.value })}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  ) : (m.difficulty || '-')}
                </td>
                <td>{m.category || '-'}</td>
                <td>
                  {editingId === m.id ? (
                    <input className="admin-inline-input admin-inline-sm" value={editFields.duration} onChange={(e) => setEditFields({ ...editFields, duration: e.target.value })} />
                  ) : (m.duration || '-')}
                </td>
                <td>
                  {editingId === m.id ? (
                    <input className="admin-inline-input admin-inline-sm" type="number" value={editFields.rewardPoints} onChange={(e) => setEditFields({ ...editFields, rewardPoints: Number(e.target.value) })} />
                  ) : (m.rewardPoints ?? '-')}
                </td>
                <td>{m.completions ?? 0}</td>
                <td>
                  {editingId === m.id ? (
                    <div className="admin-action-group">
                      <button className="admin-btn admin-btn-save" onClick={() => saveEdit(m.id)}>Save</button>
                      <button className="admin-btn admin-btn-cancel" onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div className="admin-action-group">
                      <button className="admin-btn admin-btn-edit" onClick={() => startEdit(m)}>Edit</button>
                      <button className="admin-btn admin-btn-manage" onClick={() => navigate(`/admin/modules/${m.id}`)}>Manage</button>
                      <button className="admin-btn admin-btn-delete" onClick={() => handleDelete(m.id, m.title)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {modules.length === 0 && (
              <tr><td colSpan="8" className="admin-empty">No modules found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
