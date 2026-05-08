import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminStats } from '../../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AdminLayout><p className="admin-loading">Loading...</p></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Dashboard</h1>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#375bbd' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div className="admin-stat-info">
            <p className="admin-stat-label">Total Users</p>
            <p className="admin-stat-value">{stats?.totalUsers ?? 0}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#6c5ce7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          </div>
          <div className="admin-stat-info">
            <p className="admin-stat-label">Total Modules</p>
            <p className="admin-stat-value">{stats?.totalModules ?? 0}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#00b894' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div className="admin-stat-info">
            <p className="admin-stat-label">Avg Quiz Score</p>
            <p className="admin-stat-value">{stats?.avgQuizScore ?? 0}%</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#fdcb6e' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="admin-stat-info">
            <p className="admin-stat-label">Active Users (7d)</p>
            <p className="admin-stat-value">{stats?.activeUsers ?? 0}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
