import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PointsProvider } from './context/PointsContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Lessons from './pages/Lessons'
import LessonDetail from './pages/LessonDetail'
import Quiz from './pages/Quiz'
import Profile from './pages/Profile'
import Simulator from './pages/Simulator'
import Leaderboard from './pages/Leaderboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminModules from './pages/admin/AdminModules'
import AdminScores from './pages/admin/AdminScores'
import AdminModuleEdit from './pages/admin/AdminModuleEdit'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.isAdmin ? '/admin' : '/dashboard') : '/login'} replace />} />
      <Route path="/login" element={user ? <Navigate to={user.isAdmin ? '/admin' : '/dashboard'} replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to={user.isAdmin ? '/admin' : '/dashboard'} replace /> : <Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
      <Route path="/lessons/:lessonId" element={<ProtectedRoute><LessonDetail /></ProtectedRoute>} />
      <Route path="/lessons/:lessonId/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
      <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/modules" element={<AdminRoute><AdminModules /></AdminRoute>} />
      <Route path="/admin/modules/:id" element={<AdminRoute><AdminModuleEdit /></AdminRoute>} />
      <Route path="/admin/scores" element={<AdminRoute><AdminScores /></AdminRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <PointsProvider>
        <AppRoutes />
      </PointsProvider>
    </AuthProvider>
  )
}

export default App
