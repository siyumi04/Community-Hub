import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'
import { showPopup } from '../../utils/popup'
import { apiFetch, setAuthToken } from '../../services/apiClient'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  // Student Login State
  const [studentEmail, setStudentEmail] = useState('')
  const [studentPassword, setStudentPassword] = useState('')
  const [studentErrors, setStudentErrors] = useState({ email: '', password: '' })
  const [studentTouched, setStudentTouched] = useState({ email: false, password: false })
  const [studentLoading, setStudentLoading] = useState(false)

  // Admin Login State
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminErrors, setAdminErrors] = useState({ username: '', password: '' })
  const [adminTouched, setAdminTouched] = useState({ username: false, password: false })
  const [adminLoading, setAdminLoading] = useState(false)

  // Admin Credentials Table
  const [adminCredentials, setAdminCredentials] = useState([])
  const [credentialsLoading, setCredentialsLoading] = useState(true)

  const navigate = useNavigate()

  // Fetch admin credentials on mount
  useEffect(() => {
    fetchAdminCredentials()
  }, [])

  const fetchAdminCredentials = async () => {
    try {
      setCredentialsLoading(true)
      const response = await apiFetch('/admins/credentials')
      const result = await response.json()
      if (response.ok && result.data) {
        setAdminCredentials(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch admin credentials:', err)
    } finally {
      setCredentialsLoading(false)
    }
  }

  // Student Validation
  const validateStudentField = (name, value) => {
    if (name === 'email') {
      const normalizedEmail = value.trim().toLowerCase()
      if (!normalizedEmail) return 'Email is required.'
      if (!EMAIL_PATTERN.test(normalizedEmail)) return 'Please enter a valid email address.'
      return ''
    }

    if (name === 'password') {
      const normalizedPassword = value.trim()
      if (!normalizedPassword) return 'Password is required.'
      if (normalizedPassword.length < 8) return 'Password must be at least 8 characters.'
      return ''
    }

    return ''
  }

  const validateAllStudent = () => {
    const nextErrors = {
      email: validateStudentField('email', studentEmail),
      password: validateStudentField('password', studentPassword),
    }
    setStudentErrors(nextErrors)
    return Object.values(nextErrors).every((value) => !value)
  }

  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    setStudentTouched({ email: true, password: true })

    const normalizedEmail = studentEmail.trim().toLowerCase()
    const normalizedPassword = studentPassword.trim()

    if (!validateAllStudent()) {
      showPopup('error', 'Validation Error', 'Please fix the highlighted fields.')
      return
    }

    setStudentLoading(true)

    try {
      const response = await apiFetch('/students/login', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.message || 'Invalid email or password')
      }

      const student = result?.data
      const token = result?.token
      if (!student || !(student._id || student.id)) {
        throw new Error('Login failed. Invalid server response.')
      }
      if (!token) {
        throw new Error('Login failed. Missing authentication token.')
      }

      setAuthToken(token)
      localStorage.setItem('currentStudent', JSON.stringify(student))
      window.dispatchEvent(new Event('student-profile-updated'))
      showPopup('success', 'Login Successful', 'Welcome back!')

      navigate('/dashboard')
    } catch (err) {
      showPopup('error', 'Login Failed', err.message || 'Please try again.')
    } finally {
      setStudentLoading(false)
    }
  }

  // Admin Validation
  const validateAdminField = (name, value) => {
    if (name === 'username') {
      const normalized = value.trim()
      if (!normalized) return 'Username is required.'
      if (normalized.length < 3) return 'Username must be at least 3 characters.'
      return ''
    }

    if (name === 'password') {
      const normalized = value.trim()
      if (!normalized) return 'Password is required.'
      if (normalized.length < 8) return 'Password must be at least 8 characters.'
      return ''
    }

    return ''
  }

  const validateAllAdmin = () => {
    const nextErrors = {
      username: validateAdminField('username', adminUsername),
      password: validateAdminField('password', adminPassword),
    }
    setAdminErrors(nextErrors)
    return Object.values(nextErrors).every((value) => !value)
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    setAdminTouched({ username: true, password: true })

    const normalizedUsername = adminUsername.trim()
    const normalizedPassword = adminPassword.trim()

    if (!validateAllAdmin()) {
      showPopup('error', 'Validation Error', 'Please fix the highlighted fields.')
      return
    }

    setAdminLoading(true)

    try {
      const response = await apiFetch('/admins/login', {
        method: 'POST',
        body: JSON.stringify({
          username: normalizedUsername,
          password: normalizedPassword,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.message || 'Invalid username or password')
      }

      const admin = result?.data
      const token = result?.token
      if (!admin || !(admin._id || admin.id)) {
        throw new Error('Login failed. Invalid server response.')
      }
      if (!token) {
        throw new Error('Login failed. Missing authentication token.')
      }

      setAuthToken(token)
      localStorage.setItem('currentAdmin', JSON.stringify(admin))
      window.dispatchEvent(new Event('admin-profile-updated'))
      showPopup('success', 'Admin Login Successful', `Welcome to your dashboard, ${admin.firstName}!`)

      // Navigate to admin dashboard
      navigate(`/admin-dashboard/${admin.dashboardName}`)
    } catch (err) {
      showPopup('error', 'Login Failed', err.message || 'Please try again.')
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          {/* STUDENT LOGIN SECTION */}
          <div className="login-section student-section">
            <div className="section-header">
              <h2>👤 Student Login</h2>
              <p>Sign in to your student account</p>
            </div>

            <form onSubmit={handleStudentSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="studentEmail">Email Address</label>
                <input
                  type="email"
                  id="studentEmail"
                  placeholder="your@email.com"
                  value={studentEmail}
                  onChange={(e) => {
                    const value = e.target.value
                    setStudentEmail(value)
                    if (studentTouched.email) {
                      setStudentErrors((prev) => ({ ...prev, email: validateStudentField('email', value) }))
                    }
                  }}
                  onBlur={() => {
                    setStudentTouched((prev) => ({ ...prev, email: true }))
                    setStudentErrors((prev) => ({ ...prev, email: validateStudentField('email', studentEmail) }))
                  }}
                  className={studentErrors.email && studentTouched.email ? 'input-error' : ''}
                  autoComplete="email"
                  required
                />
                {studentErrors.email && studentTouched.email && (
                  <p className="field-error">{studentErrors.email}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="studentPassword">Password</label>
                <input
                  type="password"
                  id="studentPassword"
                  placeholder="Enter your password"
                  value={studentPassword}
                  onChange={(e) => {
                    const value = e.target.value
                    setStudentPassword(value)
                    if (studentTouched.password) {
                      setStudentErrors((prev) => ({ ...prev, password: validateStudentField('password', value) }))
                    }
                  }}
                  onBlur={() => {
                    setStudentTouched((prev) => ({ ...prev, password: true }))
                    setStudentErrors((prev) => ({ ...prev, password: validateStudentField('password', studentPassword) }))
                  }}
                  className={studentErrors.password && studentTouched.password ? 'input-error' : ''}
                  minLength={8}
                  autoComplete="current-password"
                  required
                />
                {studentErrors.password && studentTouched.password && (
                  <p className="field-error">{studentErrors.password}</p>
                )}
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="login-btn student-btn" disabled={studentLoading}>
                {studentLoading ? 'Signing in...' : 'Sign In as Student'}
              </button>
            </form>

          <div className="login-divider">
            <span>Or continue with</span>
          </div>

          <div className="social-login">
            <button className="social-btn google-btn" type="button">
              <span>Google</span>
            </button>
            <button className="social-btn github-btn" type="button">
              <span>GitHub</span>
            </button>
          </div>

              <button type="submit" className="login-btn admin-btn" disabled={adminLoading}>
                {adminLoading ? 'Signing in...' : 'Sign In as Admin'}
              </button>
            </form>

            <div className="section-footer">
              <p>
                Don't have an admin account?{' '}
                <Link to="/create-account" className="register-link">
                  Create one here
                </Link>
              </p>
            </div>

            {/* ADMIN CREDENTIALS TABLE */}
            <div className="admin-credentials-section">
              <h3>👥 Registered Admins</h3>
              {credentialsLoading ? (
                <div className="credentials-loading">Loading admin list...</div>
              ) : adminCredentials.length > 0 ? (
                <div className="credentials-table-wrapper">
                  <table className="credentials-table">
                    <thead>
                      <tr>
                        <th>Admin Name</th>
                        <th>Dashboard Name</th>
                        <th>Username</th>
                        <th>Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminCredentials.map((admin) => (
                        <tr key={admin._id}>
                          <td className="admin-name">
                            {admin.firstName} {admin.lastName}
                          </td>
                          <td className="dashboard-name">
                            <code>{admin.dashboardName}</code>
                          </td>
                          <td className="username">
                            <code>{admin.username}</code>
                          </td>
                          <td className="password">
                            <code>{admin.password}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-admins">No registered admins yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="login-background">
          <div className="gradient-orb top"></div>
          <div className="gradient-orb bottom"></div>
        </div>
      </div>
    </div>
  )
}

export default Login
