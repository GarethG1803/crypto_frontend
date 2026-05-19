import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePoints } from '../context/PointsContext'
import bgImage from '../assets/bg-mountain.jpg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showGreeting, setShowGreeting] = useState(true)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { refreshPoints } = usePoints()

  const canSubmit = email.trim() !== '' && password.trim() !== '' && !loading

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 3200)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      refreshPoints()
      navigate(data.isAdmin ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <img src={bgImage} alt="" className="auth-bg" />

      {showGreeting && (
        <div className="hello-behind">
          <h1 className="hello-text">Welcome Back</h1>
        </div>
      )}

      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
              <path d="M18 6C15.5 4 9 5 9 10C9 15 19 13 19 19C19 23.5 13 24.5 9.5 23" stroke="url(#solifyGradAuth)" strokeWidth="2.8" strokeLinecap="round"/>
              <circle cx="22" cy="23" r="2.2" fill="#5b7fd6"/>
              <defs>
                <linearGradient id="solifyGradAuth" x1="9" y1="5" x2="19" y2="24">
                  <stop stopColor="#375bbd"/>
                  <stop offset="1" stopColor="#7c9be6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Log In</h1>
          <p className="subtitle">Welcome back! Please enter your details</p>

          {error && <p className="auth-error">{error}</p>}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>


          <button type="submit" className="submit-btn" disabled={!canSubmit}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <p className="switch-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
