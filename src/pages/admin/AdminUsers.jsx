import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '../../services/api'

function formatLastOnline(dateStr) {
  if (!dateStr) return { text: 'Never', isActive: false }
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  const isActive = diffMins < 5
  let text
  if (diffMins < 1) text = 'Just now'
  else if (diffMins < 60) text = `${diffMins}m ago`
  else if (diffHours < 24) text = `${diffHours}h ago`
  else if (diffDays < 7) text = `${diffDays}d ago`
  else text = date.toLocaleDateString()

  return { text, isActive }
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUid, setEditingUid] = useState(null)
  const [editFields, setEditFields] = useState({})

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (u) => {
    setEditingUid(u.uid)
    setEditFields({ name: u.name || '', points: u.points || 0, level: u.level || 1, isAdmin: u.isAdmin || false })
  }

  const cancelEdit = () => {
    setEditingUid(null)
    setEditFields({})
  }

  const saveEdit = async (uid) => {
    try {
      await updateAdminUser(uid, editFields)
      setUsers(users.map(u => u.uid === uid ? { ...u, ...editFields } : u))
      setEditingUid(null)
    } catch (err) {
      alert('Failed to update user: ' + err.message)
    }
  }

  const handleDelete = async (uid, name) => {
    if (!confirm(`Delete user "${name || uid}"? This cannot be undone.`)) return
    try {
      await deleteAdminUser(uid)
      setUsers(users.filter(u => u.uid !== uid))
    } catch (err) {
      alert('Failed to delete user: ' + err.message)
    }
  }

  if (loading) return <AdminLayout><p className="admin-loading">Loading...</p></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Users</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Points</th>
              <th>Level</th>
              <th>Streak</th>
              <th>Admin</th>
              <th>Last Online</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td>
                  {editingUid === u.uid ? (
                    <input className="admin-inline-input" value={editFields.name} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} />
                  ) : (u.name || '-')}
                </td>
                <td>{u.email || '-'}</td>
                <td>
                  {editingUid === u.uid ? (
                    <input className="admin-inline-input admin-inline-sm" type="number" value={editFields.points} onChange={(e) => setEditFields({ ...editFields, points: Number(e.target.value) })} />
                  ) : (u.points ?? 0)}
                </td>
                <td>
                  {editingUid === u.uid ? (
                    <input className="admin-inline-input admin-inline-sm" type="number" value={editFields.level} onChange={(e) => setEditFields({ ...editFields, level: Number(e.target.value) })} />
                  ) : (u.level ?? 1)}
                </td>
                <td>{u.streak ?? 0}</td>
                <td>
                  {editingUid === u.uid ? (
                    <input type="checkbox" checked={editFields.isAdmin} onChange={(e) => setEditFields({ ...editFields, isAdmin: e.target.checked })} />
                  ) : (u.isAdmin ? 'Yes' : 'No')}
                </td>
                <td>
                  {(() => {
                    const { text, isActive } = formatLastOnline(u.lastActiveDate)
                    return (
                      <span className={`admin-status ${isActive ? 'admin-status-active' : 'admin-status-offline'}`}>
                        <span className="admin-status-dot" />
                        {text}
                      </span>
                    )
                  })()}
                </td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                  {editingUid === u.uid ? (
                    <div className="admin-action-group">
                      <button className="admin-btn admin-btn-save" onClick={() => saveEdit(u.uid)}>Save</button>
                      <button className="admin-btn admin-btn-cancel" onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div className="admin-action-group">
                      <button className="admin-btn admin-btn-edit" onClick={() => startEdit(u)}>Edit</button>
                      <button className="admin-btn admin-btn-delete" onClick={() => handleDelete(u.uid, u.name)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="9" className="admin-empty">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
