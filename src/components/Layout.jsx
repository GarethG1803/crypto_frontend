import { NavLink } from 'react-router-dom'
import { usePoints } from '../context/PointsContext'
import { useAuth } from '../context/AuthContext'
import trophyIcon from '../assets/trophy-small.png'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/lessons',
    label: 'Lessons',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    to: '/simulator',
    label: 'Simulator',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    to: '/leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
]

export default function Layout({ children }) {
  const pointsCtx = usePoints()
  const points = pointsCtx?.points ?? 0
  const animation = pointsCtx?.animation
  const { user } = useAuth()
  const displayName = user?.name || user?.email || ''
  const nameInitial = displayName ? displayName.charAt(0).toUpperCase() : '?'

  return (
    <div className="layout">
      <div className="topbar">
        <div className="topbar-logo">
          <svg className="logo-mark" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M18 6C15.5 4 9 5 9 10C9 15 19 13 19 19C19 23.5 13 24.5 9.5 23" stroke="url(#solifyGrad)" strokeWidth="2.8" strokeLinecap="round"/>
            <circle cx="22" cy="23" r="2.2" fill="#5b7fd6"/>
            <defs>
              <linearGradient id="solifyGrad" x1="9" y1="5" x2="19" y2="24">
                <stop stopColor="#375bbd"/>
                <stop offset="1" stopColor="#7c9be6"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-text">Solify<span className="logo-dot">.</span></span>
        </div>
        <div className="topbar-right">
          <div className="topbar-points">
            <img src={trophyIcon} alt="" className="topbar-points-icon" />
            <span className="topbar-points-value">{points.toLocaleString()}</span>
            <span className="topbar-points-label">pts</span>
            {animation && (
              <span className="topbar-points-popup" key={animation + Date.now()}>
                +{animation}
              </span>
            )}
          </div>
          <div className="topbar-user">
            <div className="topbar-user-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" className="avatar-img" />
              ) : (
                nameInitial
              )}
            </div>
            {displayName && <span className="topbar-user-name">{displayName}</span>}
          </div>
        </div>
      </div>
      <aside className="sidebar">
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
