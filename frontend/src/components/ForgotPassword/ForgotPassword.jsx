import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { showPopup } from '../../utils/popup'
import './ForgotPassword.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IT_NUMBER_PATTERN = /^IT\d{2}[A-Za-z0-9]{6}$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

function ForgotPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    itNumber: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [touched, setTouched] = useState({
    email: false,
    itNumber: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    itNumber: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const validateField = (name, value, currentForm = form) => {
    if (name === 'email') {
      const normalized = String(value).trim().toLowerCase()
      if (!normalized) return 'Email is required.'
      if (!EMAIL_PATTERN.test(normalized)) return 'Please enter a valid email address.'
      return ''
    }

    if (name === 'itNumber') {
      const normalized = String(value).trim().toUpperCase()
      if (!normalized) return 'IT Number is required.'
      if (!IT_NUMBER_PATTERN.test(normalized)) return 'Format should be like IT21ABC123.'
      return ''
    }

    if (name === 'newPassword') {
      if (!String(value).trim()) return 'New password is required.'
      if (!PASSWORD_PATTERN.test(String(value))) {
        return 'Need 8+ chars, uppercase, lowercase and number.'
      }
      return ''
    }

    if (name === 'confirmPassword') {
      if (!String(value).trim()) return 'Please confirm password.'
      if (String(value) !== String(currentForm.newPassword)) return 'Passwords do not match.'
      return ''
    }

    return ''
  }

  const validateAll = () => {
    const nextErrors = {
      email: validateField('email', form.email),
      itNumber: validateField('itNumber', form.itNumber),
      newPassword: validateField('newPassword', form.newPassword),
      confirmPassword: validateField('confirmPassword', form.confirmPassword, form),
    }
    setFieldErrors(nextErrors)
    return Object.values(nextErrors).every((value) => !value)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const nextForm = { ...form, [name]: value }
    setForm(nextForm)

    if (touched[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value, nextForm) }))
    }

    if (name === 'newPassword' && touched.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', nextForm.confirmPassword, nextForm),
      }))
    }
  }

  const markFieldTouched = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, form[name], form) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setTouched({
      email: true,
      itNumber: true,
      newPassword: true,
      confirmPassword: true,
    })

    if (!validateAll()) {
      showPopup('Please fix the highlighted fields.', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/students/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          itNumber: form.itNumber.trim().toUpperCase(),
          newPassword: form.newPassword,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.message || 'Password reset failed')
      }

      showPopup('Password reset successful. Please sign in.', 'success')
      navigate('/login')
    } catch (err) {
      showPopup(err.message || 'Password reset failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Forgot Password</h2>
        <p>Reset your password using your email and IT number.</p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={() => markFieldTouched('email')}
              className={fieldErrors.email && touched.email ? 'input-error' : ''}
              placeholder="student@email.com"
              required
            />
            {fieldErrors.email && touched.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="itNumber">IT Number</label>
            <input
              id="itNumber"
              name="itNumber"
              type="text"
              value={form.itNumber}
              onChange={handleChange}
              onBlur={() => markFieldTouched('itNumber')}
              className={fieldErrors.itNumber && touched.itNumber ? 'input-error' : ''}
              placeholder="IT21ABC123"
              required
            />
            {fieldErrors.itNumber && touched.itNumber && <p className="field-error">{fieldErrors.itNumber}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              onBlur={() => markFieldTouched('newPassword')}
              className={fieldErrors.newPassword && touched.newPassword ? 'input-error' : ''}
              placeholder="New secure password"
              required
            />
            {fieldErrors.newPassword && touched.newPassword && <p className="field-error">{fieldErrors.newPassword}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={() => markFieldTouched('confirmPassword')}
              className={fieldErrors.confirmPassword && touched.confirmPassword ? 'input-error' : ''}
              placeholder="Confirm new password"
              required
            />
            {fieldErrors.confirmPassword && touched.confirmPassword && (
              <p className="field-error">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button type="submit" className="reset-btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="back-to-login">
          Remembered your password? <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
