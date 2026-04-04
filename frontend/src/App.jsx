import { Routes, Route, Navigate } from 'react-router-dom'
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
import NoticeSummarizer from './components/NoticeSummarizer/NoticeSummarizer'
import CommunityDetailsPage from './pages/CommunityDetailsPage'
import CommunityMemberPage from './pages/CommunityMemberPage'
import { getAuthToken } from './services/apiClient'

import './App.css'

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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
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
          <Route path="/communities/:id" element={<CommunityDetailsPage />} />
          <Route path="/communities/:id/member" element={<CommunityMemberPage />} />
          {/* Shorthand routes for communities */}
          <Route path="/cricket" element={<Navigate to="/communities/cricket" replace />} />
          <Route path="/hockey" element={<Navigate to="/communities/hockey" replace />} />
          <Route path="/environmental" element={<Navigate to="/communities/environmental" replace />} />
          <Route path="/foc" element={<Navigate to="/communities/foc" replace />} />
          <Route path="/food" element={<Navigate to="/communities/food" replace />} />
          <Route path="*" element={<div className="flex items-center justify-center py-32 text-2xl text-slate-500">Page Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
