import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { to: '/admin/users', label: 'Users', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
  )},
  { to: '/admin/modules', label: 'Modules', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
  )},
  { to: '/admin/scores', label: 'Scores', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  )},
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      <div className="admin-topbar">
        <div className="admin-topbar-brand">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" style={{flexShrink:0}}>
            <path d="M18 6C15.5 4 9 5 9 10C9 15 19 13 19 19C19 23.5 13 24.5 9.5 23" stroke="url(#solifyGradAdmin)" strokeWidth="2.8" strokeLinecap="round"/>
            <circle cx="22" cy="23" r="2.2" fill="#7c9be6"/>
            <defs>
              <linearGradient id="solifyGradAdmin" x1="9" y1="5" x2="19" y2="24">
                <stop stopColor="#5b7fd6"/>
                <stop offset="1" stopColor="#7c9be6"/>
              </linearGradient>
            </defs>
          </svg>
          Solify<span style={{color:'#5b7fd6'}}>.</span> Admin
        </div>
        <div className="admin-topbar-right">
          <span className="admin-topbar-user">{user?.name || user?.email}</span>
          <button className="admin-topbar-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <aside className="admin-sidebar">
        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
