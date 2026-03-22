import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'
import { showPopup } from '../../utils/popup'
import { apiFetch, setAuthToken } from '../../services/apiClient'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateLoginField = (name, value) => {
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

  const validateAll = () => {
    const nextErrors = {
      email: validateLoginField('email', email),
      password: validateLoginField('password', password),
    }
    setFieldErrors(nextErrors)
    return Object.values(nextErrors).every((value) => !value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPassword = password.trim()

    if (!validateAll()) {
      showPopup('Please fix the highlighted login fields.', 'error')
      return
    }

    setLoading(true)

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
      showPopup('Login successful. Welcome back!', 'success')

      navigate('/dashboard')
    } catch (err) {
      showPopup(err.message || 'Login failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  const value = e.target.value
                  setEmail(value)
                  if (touched.email) {
                    setFieldErrors((prev) => ({ ...prev, email: validateLoginField('email', value) }))
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, email: true }))
                  setFieldErrors((prev) => ({ ...prev, email: validateLoginField('email', email) }))
                }}
                className={fieldErrors.email && touched.email ? 'input-error' : ''}
                autoComplete="email"
                required
              />
              {fieldErrors.email && touched.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  const value = e.target.value
                  setPassword(value)
                  if (touched.password) {
                    setFieldErrors((prev) => ({ ...prev, password: validateLoginField('password', value) }))
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, password: true }))
                  setFieldErrors((prev) => ({ ...prev, password: validateLoginField('password', password) }))
                }}
                className={fieldErrors.password && touched.password ? 'input-error' : ''}
                minLength={8}
                autoComplete="current-password"
                required
              />
              {fieldErrors.password && touched.password && <p className="field-error">{fieldErrors.password}</p>}
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

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
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

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Sign up here
              </Link>
            </p>
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
