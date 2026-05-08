import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getAchievements, getProgress, changePassword, checkUsername, uploadProfilePicture } from '../services/api'
import { useAuth } from '../context/AuthContext'
import trophyIcon from '../assets/trophy.png'
import lessonsIcon from '../assets/lessons-completed.png'
import thunderIcon from '../assets/thunder.png'
import streakIcon from '../assets/streak-icon.png'
import rewardIcon from '../assets/reward.png'
import perfectQuiz from '../assets/perfect-quiz.png'
import checkIcon from '../assets/check.png'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const [achievements, setAchievements] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameStatus, setNameStatus] = useState(null) // null | 'checking' | 'available' | 'taken'
  const nameDebounceRef = useRef(null)

  // Change password state
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(null) // { type: 'success' | 'error', text }

  const fileInputRef = useRef(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)

  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const passwordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber
  const passwordsMatch = newPassword === confirmNewPassword && confirmNewPassword !== ''

  useEffect(() => {
    Promise.all([getAchievements(), getProgress()])
      .then(([a, p]) => { setAchievements(a); setProgress(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Debounced username availability check while editing
  useEffect(() => {
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current)
    if (!editing) { setNameStatus(null); return }
    const trimmed = editName.trim()
    if (!trimmed || trimmed.toLowerCase() === (user?.name || '').toLowerCase()) {
      setNameStatus(null)
      return
    }
    setNameStatus('checking')
    nameDebounceRef.current = setTimeout(async () => {
      try {
        const data = await checkUsername(trimmed)
        setNameStatus(data.available ? 'available' : 'taken')
      } catch {
        setNameStatus(null)
      }
    }, 500)
    return () => { if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current) }
  }, [editName, editing])

  const displayName = user?.name || user?.email || 'Learner'
  const nameInitial = displayName.charAt(0).toUpperCase()

  const handleEditClick = () => {
    setEditName(user?.name || '')
    setEditing(true)
  }

  const handleSaveName = async () => {
    if (editName.trim() && nameStatus !== 'taken') {
      setSaving(true)
      await updateUser({ name: editName.trim() })
      setSaving(false)
      setEditing(false)
      setNameStatus(null)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setNameStatus(null)
  }

  const handleChangePassword = async () => {
    if (!passwordValid || !passwordsMatch) return
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      await changePassword(newPassword)
      setPasswordMsg({ type: 'success', text: 'Password updated successfully' })
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => { setChangingPassword(false); setPasswordMsg(null) }, 2000)
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleCancelPassword = () => {
    setChangingPassword(false)
    setNewPassword('')
    setConfirmNewPassword('')
    setPasswordMsg(null)
  }

  const handleAvatarClick = () => {
    if (!uploadingPicture) fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are allowed.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File must be under 2 MB.')
      return
    }

    setUploadingPicture(true)
    try {
      const data = await uploadProfilePicture(file)
      updateUser({ profilePicture: data.profilePicture })
    } catch (err) {
      alert(err.message || 'Upload failed')
    } finally {
      setUploadingPicture(false)
    }
  }

  const unlocked = achievements.filter(a => a.unlocked)
  const locked = achievements.filter(a => !a.unlocked)
  const lessonsCompleted = progress.filter(p => p.lessonCompleted).length
  const perfectQuizzes = progress.filter(p => p.quizScore === 100).length
  const totalPoints = unlocked.reduce((sum, a) => sum + (a.rewardPoints || 0), 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const EyeOpen = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  const EyeClosed = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

  if (loading) return <Layout><p>Loading...</p></Layout>

  return (
    <Layout>
      {/* Profile Banner */}
      <div className="profile-banner">
        <div className="profile-banner-content">
          <div className="profile-avatar" onClick={handleAvatarClick} style={{ cursor: 'pointer', position: 'relative' }}>
            {uploadingPicture ? (
              <div className="avatar-upload-spinner" />
            ) : user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="avatar-img" />
            ) : (
              nameInitial
            )}
            <div className="avatar-camera-overlay">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />
          </div>
          <div className="profile-info">
            {editing ? (
              <div className="profile-edit-inline">
                <input
                  type="text"
                  className="profile-edit-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                {nameStatus === 'checking' && <span className="username-status checking">Checking...</span>}
                {nameStatus === 'available' && <span className="username-status available">Username available</span>}
                {nameStatus === 'taken' && <span className="username-status taken">Username is taken</span>}
                <div className="profile-edit-actions">
                  <button className="profile-edit-save" onClick={handleSaveName} disabled={saving || nameStatus === 'taken'}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button className="profile-edit-cancel" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="profile-name-row">
                  <h2>{displayName}</h2>
                  <button className="profile-edit-btn" onClick={handleEditClick} title="Edit username">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
                <p>{user?.email || 'Track your learning journey'}</p>
              </>
            )}
          </div>
        </div>
        <div className="profile-tags">
          {unlocked.slice(0, 2).map((a, i) => (
            <span key={i} className="profile-tag">{a.icon} {a.title}</span>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="profile-password-section">
        {!changingPassword ? (
          <button className="profile-change-pw-btn" onClick={() => setChangingPassword(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Change Password
          </button>
        ) : (
          <div className="profile-pw-form">
            <h4>Change Password</h4>
            {passwordMsg && (
              <div className={`profile-pw-msg ${passwordMsg.type}`}>{passwordMsg.text}</div>
            )}
            <div className="profile-pw-field">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              {newPassword && (
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
            <div className="profile-pw-field">
              <label>Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              {confirmNewPassword && !passwordsMatch && (
                <span className="password-mismatch">Passwords do not match</span>
              )}
            </div>
            <div className="profile-pw-actions">
              <button className="profile-edit-save" onClick={handleChangePassword} disabled={!passwordValid || !passwordsMatch || passwordSaving}>
                {passwordSaving ? 'Saving...' : 'Update Password'}
              </button>
              <button className="profile-edit-cancel" onClick={handleCancelPassword}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="profile-stats">
        <div className="profile-stat-card">
          <img src={trophyIcon} alt="" />
          <span className="label">Total Points</span>
          <span className="value">{totalPoints}</span>
        </div>
        <div className="profile-stat-card">
          <img src={lessonsIcon} alt="" />
          <span className="label">Lessons Completed</span>
          <span className="value">{lessonsCompleted}</span>
        </div>
        <div className="profile-stat-card">
          <img src={thunderIcon} alt="" />
          <span className="label">Current Streaks</span>
          <span className="value">0</span>
        </div>
        <div className="profile-stat-card">
          <img src={streakIcon} alt="" />
          <span className="label">Longest Streaks</span>
          <span className="value">0</span>
        </div>
        <div className="profile-stat-card">
          <img src={rewardIcon} alt="" />
          <span className="label">Achievements</span>
          <span className="value">{unlocked.length}/{achievements.length}</span>
        </div>
        <div className="profile-stat-card">
          <img src={perfectQuiz} alt="" />
          <span className="label">Perfect Quizzes</span>
          <span className="value">{perfectQuizzes}</span>
        </div>
      </div>

      {/* Achievements */}
      <h3 className="profile-section-title">Achievements ({unlocked.length}/{achievements.length})</h3>

      <h4 className="profile-subsection-title">Unlocked</h4>
      <div className="profile-achievements-grid">
        {unlocked.map((a, i) => (
          <div key={i} className="profile-achievement unlocked">
            <div className="achievement-emoji">{a.icon}</div>
            <p className="achievement-title">{a.title}</p>
            <p className="achievement-desc">{a.description}</p>
            <div className="achievement-footer">
              <span className="pts">+{a.rewardPoints} pts</span>
              <span className="status unlocked-status">
                <img src={checkIcon} alt="" /> Unlocked
              </span>
            </div>
          </div>
        ))}
        {unlocked.length === 0 && <p>No achievements unlocked yet. Start learning!</p>}
      </div>

      <h4 className="profile-subsection-title">Locked</h4>
      <div className="profile-achievements-grid">
        {locked.map((a, i) => (
          <div key={i} className="profile-achievement locked">
            <div className="locked-overlay" />
            <div className="achievement-emoji locked-emoji">{a.icon}</div>
            <p className="achievement-title locked-text">{a.title}</p>
            <p className="achievement-desc locked-text">{a.description}</p>
            <div className="achievement-footer">
              <span className="pts locked-text">+{a.rewardPoints} pts</span>
              <span className="status locked-text">🔒 Locked</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="profile-tips">
        <h4>💡 Tips to Progress</h4>
        <ul>
          <li>Complete lessons daily to maintain and grow your streak</li>
          <li>Aim for perfect quiz scores to unlock special achievements</li>
          <li>Challenge yourself with advanced lessons for more points</li>
          <li>Retake quizzes to improve your knowledge and scores</li>
        </ul>
      </div>

      {/* Log Out */}
      <div className="sim-tips" style={{ marginTop: 8 }}>
        <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>Your progress and data will be saved when you log out.</p>
        <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      </div>
    </Layout>
  )
}
