import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import HomePage from './components/HomePage/HomePage'
import Dashboard from './components/Dashboard/Dashboard'
import EditProfile from './components/EditProfile/EditProfile'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import CreateAccount from './components/CreateAccount/CreateAccount'
import AdminDashboard from './components/AdminDashboard/AdminDashboard'
import ForgotPassword from './components/ForgotPassword/ForgotPassword'
import { getAuthToken } from './services/apiClient'

function ProtectedRoute({ children }) {
  const hasStudent = !!localStorage.getItem('currentStudent')
  const hasToken = !!getAuthToken()

  if (!hasStudent || !hasToken) {
    return <Navigate to="/login" replace />
  }

  return children
}

function ProtectedAdminRoute({ children }) {
  const hasAdmin = !!localStorage.getItem('currentAdmin')
  const hasToken = !!getAuthToken()

  if (!hasAdmin || !hasToken) {
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
          path="/admin-dashboard/:dashboardName"
          element={(
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          )}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
