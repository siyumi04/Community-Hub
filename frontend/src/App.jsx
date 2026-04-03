import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import HomePage from './components/HomePage/HomePage'
import Dashboard from './components/Dashboard/Dashboard'
import EditProfile from './components/EditProfile/EditProfile'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import ForgotPassword from './components/ForgotPassword/ForgotPassword'
import NoticeSummarizer from './components/NoticeSummarizer/NoticeSummarizer'
import { getAuthToken } from './services/apiClient'

function ProtectedRoute({ children }) {
  const hasStudent = !!localStorage.getItem('currentStudent')
  const hasToken = !!getAuthToken()

  if (!hasStudent || !hasToken) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/edit-profile"
          element={(
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/notice-summarizer"
          element={(
            <ProtectedRoute>
              <NoticeSummarizer />
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
