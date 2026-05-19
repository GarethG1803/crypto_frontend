import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePoints } from '../context/PointsContext'
import { checkUsername } from '../services/api'
import bgImage from '../assets/bg-mountain.jpg'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGreeting, setShowGreeting] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'checking' | 'available' | 'taken'
  const debounceRef = useRef(null)
  const navigate = useNavigate()
  const { signup } = useAuth()
  const { refreshPoints } = usePoints()

  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const passwordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  const canSubmit = name.trim() !== '' && email.trim() !== '' && passwordValid && passwordsMatch && usernameStatus !== 'taken' && !loading

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 3200)
    return () => clearTimeout(timer)
  }, [])

  // Debounced username check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = name.trim()
    if (!trimmed) {
      setUsernameStatus(null)
      return
    }
    setUsernameStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await checkUsername(trimmed)
        setUsernameStatus(data.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus(null)
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [name])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signup(name, email, password)
      refreshPoints()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const EyeOpen = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  const EyeClosed = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

  return (
    <div className="auth-page">
      <img src={bgImage} alt="" className="auth-bg" />

      {showGreeting && (
        <div className="hello-behind">
          <h1 className="hello-text">Hello</h1>
        </div>
      )}

      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-logo">
            <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
              <path d="M18 6C15.5 4 9 5 9 10C9 15 19 13 19 19C19 23.5 13 24.5 9.5 23" stroke="url(#solifyGradAuth2)" strokeWidth="2.8" strokeLinecap="round"/>
              <circle cx="22" cy="23" r="2.2" fill="#5b7fd6"/>
              <defs>
                <linearGradient id="solifyGradAuth2" x1="9" y1="5" x2="19" y2="24">
                  <stop stopColor="#375bbd"/>
                  <stop offset="1" stopColor="#7c9be6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Sign Up</h1>
          <p className="subtitle">Good to see you! Enjoy learning Crypto</p>

          {error && <p className="auth-error">{error}</p>}

          <div className="field">
            <label>Username</label>
            <input
              type="text"
              placeholder="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {usernameStatus === 'checking' && <span className="username-status checking">Checking...</span>}
            {usernameStatus === 'available' && <span className="username-status available">Username available</span>}
            {usernameStatus === 'taken' && <span className="username-status taken">Username is taken</span>}
          </div>

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
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
            {password && (
              <div className="password-requirements">
                <div className={`req ${hasMinLength ? 'met' : ''}`}>
                  <span className="req-icon">{hasMinLength ? '\u2713' : '\u2717'}</span> Min 8 characters
                </div>
                <div className={`req ${hasUppercase ? 'met' : ''}`}>
                  <span className="req-icon">{hasUppercase ? '\u2713' : '\u2717'}</span> 1 uppercase letter
                </div>
                <div className={`req ${hasLowercase ? 'met' : ''}`}>
                  <span className="req-icon">{hasLowercase ? '\u2713' : '\u2717'}</span> 1 lowercase letter
                </div>
                <div className={`req ${hasNumber ? 'met' : ''}`}>
                  <span className="req-icon">{hasNumber ? '\u2713' : '\u2717'}</span> 1 number
                </div>
              </div>
            )}
          </div>

          <div className="field">
            <label>Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <span className="password-mismatch">Passwords do not match</span>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={!canSubmit}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <p className="switch-link">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
