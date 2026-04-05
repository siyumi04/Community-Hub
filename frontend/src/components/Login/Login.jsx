import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'
import { showPopup } from '../../utils/popup'
import { apiFetch, setAuthToken } from '../../services/apiClient'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const [activeRole, setActiveRole] = useState('student')

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

  const navigate = useNavigate()

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
      localStorage.removeItem('currentAdmin')
      localStorage.setItem('currentStudent', JSON.stringify(student))
      window.dispatchEvent(new Event('student-profile-updated'))
      window.dispatchEvent(new Event('admin-profile-updated'))
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
      
      // Validate password format: exactly 7 characters with exactly 5 digits and 2 letters
      if (normalized.length !== 7) {
        return 'Password must be exactly 7 characters.'
      }
      
      const digitCount = (normalized.match(/\d/g) || []).length
      const letterCount = (normalized.match(/[a-zA-Z]/g) || []).length
      
      if (digitCount !== 5) {
        return 'Password must contain exactly 5 digits.'
      }
      
      if (letterCount !== 2) {
        return 'Password must contain exactly 2 letters.'
      }
      
      // Check that it only contains alphanumeric characters
      if (!/^[a-zA-Z0-9]{7}$/.test(normalized)) {
        return 'Password must only contain letters and numbers.'
      }
      
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

      const admin = result?.data?.admin
      const token = result?.data?.token
      if (!admin || !(admin._id || admin.id)) {
        throw new Error('Login failed. Invalid server response.')
      }
      if (!token) {
        throw new Error('Login failed. Missing authentication token.')
      }

      setAuthToken(token)
      localStorage.removeItem('currentStudent')
      localStorage.setItem('currentAdmin', JSON.stringify(admin))
      window.dispatchEvent(new Event('admin-profile-updated'))
      window.dispatchEvent(new Event('student-profile-updated'))
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
          <div className="login-head">
            <h1>Welcome Back</h1>
            <p>Choose your account type and continue</p>
          </div>

          <div className="login-role-switch" role="tablist" aria-label="Login role switch">
            <button
              type="button"
              className={`role-btn ${activeRole === 'student' ? 'active' : ''}`}
              onClick={() => setActiveRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={`role-btn ${activeRole === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin')}
            >
              Admin
            </button>
          </div>

          {activeRole === 'student' ? (
            <form onSubmit={handleStudentSubmit} className="login-form" noValidate>
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
                {studentErrors.email && studentTouched.email && <p className="field-error">{studentErrors.email}</p>}
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
                {studentErrors.password && studentTouched.password && <p className="field-error">{studentErrors.password}</p>}
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

              <button type="submit" className="login-btn" disabled={studentLoading}>
                {studentLoading ? 'Signing in...' : 'Sign In as Student'}
              </button>

              <p className="section-footer">
                Don't have a student account? <Link to="/create-account" className="register-link">Create account</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="adminUsername">Username</label>
                <input
                  type="text"
                  id="adminUsername"
                  placeholder="Enter your username"
                  value={adminUsername}
                  onChange={(e) => {
                    const value = e.target.value
                    setAdminUsername(value)
                    if (adminTouched.username) {
                      setAdminErrors((prev) => ({ ...prev, username: validateAdminField('username', value) }))
                    }
                  }}
                  onBlur={() => {
                    setAdminTouched((prev) => ({ ...prev, username: true }))
                    setAdminErrors((prev) => ({ ...prev, username: validateAdminField('username', adminUsername) }))
                  }}
                  className={adminErrors.username && adminTouched.username ? 'input-error' : ''}
                  autoComplete="username"
                  required
                />
                {adminErrors.username && adminTouched.username && <p className="field-error">{adminErrors.username}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="adminPassword">Password</label>
                <input
                  type="password"
                  id="adminPassword"
                  placeholder="Enter your password"
                  value={adminPassword}
                  onChange={(e) => {
                    const value = e.target.value
                    setAdminPassword(value)
                    if (adminTouched.password) {
                      setAdminErrors((prev) => ({ ...prev, password: validateAdminField('password', value) }))
                    }
                  }}
                  onBlur={() => {
                    setAdminTouched((prev) => ({ ...prev, password: true }))
                    setAdminErrors((prev) => ({ ...prev, password: validateAdminField('password', adminPassword) }))
                  }}
                  className={adminErrors.password && adminTouched.password ? 'input-error' : ''}
                  autoComplete="current-password"
                  required
                />
                {adminErrors.password && adminTouched.password && <p className="field-error">{adminErrors.password}</p>}
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

              <button type="submit" className="login-btn" disabled={adminLoading}>
                {adminLoading ? 'Signing in...' : 'Sign In as Admin'}
              </button>

              <p className="section-footer">
                Need admin access? Contact the system administrator.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
