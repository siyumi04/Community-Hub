import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Register.css'
import { showPopup } from '../../utils/popup'

const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]{1,29}$/
const IT_NUMBER_PATTERN = /^IT\d{2}[A-Za-z0-9]{6}$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    itNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    skills: '', 
    acceptTerms: false,
  })
  const [fieldErrors, setFieldErrors] = useState({
    firstName: '',
    lastName: '',
    itNumber: '',
    email: '',
    skills: '',
    password: '',
    confirmPassword: '',
    acceptTerms: '',
  })
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    itNumber: false,
    email: false,
    skills: false,
    password: false,
    confirmPassword: false,
    acceptTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateField = (name, value, currentForm = formData) => {
    if (name === 'firstName' || name === 'lastName') {
      const normalized = String(value).trim()
      if (!normalized) return 'This field is required.'
      if (!NAME_PATTERN.test(normalized)) return 'Use 2-30 letters only.'
      return ''
    }

    if (name === 'itNumber') {
      const normalized = String(value).trim().toUpperCase()
      if (!normalized) return 'IT Number is required.'
      if (!IT_NUMBER_PATTERN.test(normalized)) return 'Format should be like IT21ABC123.'
      return ''
    }

    if (name === 'email') {
      const normalized = String(value).trim().toLowerCase()
      if (!normalized) return 'Email is required.'
      if (normalized.includes(' ')) return 'Email cannot contain spaces.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'Enter a valid email.'
      return ''
    }

    if (name === 'skills') {
      const skills = String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      if (skills.length === 0) return 'Add at least one skill.'
      if (skills.length > 12) return 'Maximum 12 skills allowed.'
      return ''
    }

    if (name === 'password') {
      if (!String(value).trim()) return 'Password is required.'
      if (!PASSWORD_PATTERN.test(String(value))) {
        return 'Need 8+ chars, uppercase, lowercase and number.'
      }
      return ''
    }

    if (name === 'confirmPassword') {
      if (!String(value).trim()) return 'Confirm your password.'
      if (String(value) !== String(currentForm.password)) return 'Passwords do not match.'
      return ''
    }

    if (name === 'acceptTerms') {
      if (!value) return 'You must accept terms to continue.'
      return ''
    }

    return ''
  }

  const validateAll = () => {
    const nextErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      itNumber: validateField('itNumber', formData.itNumber),
      email: validateField('email', formData.email),
      skills: validateField('skills', formData.skills),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData),
      acceptTerms: validateField('acceptTerms', formData.acceptTerms),
    }
    setFieldErrors(nextErrors)
    return Object.values(nextErrors).every((value) => !value)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }))

    if (touched[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, nextValue, { ...formData, [name]: nextValue }),
      }))
    }

    if (name === 'password' && touched.confirmPassword) {
      const nextForm = { ...formData, password: value }
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', nextForm.confirmPassword, nextForm),
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({
      firstName: true,
      lastName: true,
      itNumber: true,
      email: true,
      skills: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true,
    })

    const firstName = formData.firstName.trim()
    const lastName = formData.lastName.trim()
    const itNumber = formData.itNumber.trim().toUpperCase()
    const email = formData.email.trim().toLowerCase()
    const skills = formData.skills
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!validateAll()) {
      showPopup('Please fix the highlighted registration fields.', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          itNumber,
          email,
          password: formData.password,
          skills,
        }),
      })

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      showPopup('Account created successfully. Please sign in.', 'success')
      navigate('/login')
    } catch (err) {
      showPopup(err.message || 'Registration failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-header">
            <h2>Create Account</h2>
            <p>Join our community today</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Row 1: Names */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, firstName: true }))
                    setFieldErrors((prev) => ({ ...prev, firstName: validateField('firstName', formData.firstName) }))
                  }}
                  className={fieldErrors.firstName && touched.firstName ? 'input-error' : ''}
                  required
                />
                {fieldErrors.firstName && touched.firstName && <p className="field-error">{fieldErrors.firstName}</p>}
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, lastName: true }))
                    setFieldErrors((prev) => ({ ...prev, lastName: validateField('lastName', formData.lastName) }))
                  }}
                  className={fieldErrors.lastName && touched.lastName ? 'input-error' : ''}
                  required
                />
                {fieldErrors.lastName && touched.lastName && <p className="field-error">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* Row 2: IT Number & Email */}
            <div className="form-row">
              <div className="form-group">
                <label>IT Number</label>
                <input
                  type="text"
                  name="itNumber"
                  placeholder="IT21XXXXXX"
                  value={formData.itNumber}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, itNumber: true }))
                    setFieldErrors((prev) => ({ ...prev, itNumber: validateField('itNumber', formData.itNumber) }))
                  }}
                  className={fieldErrors.itNumber && touched.itNumber ? 'input-error' : ''}
                  required
                />
                {fieldErrors.itNumber && touched.itNumber && <p className="field-error">{fieldErrors.itNumber}</p>}
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, email: true }))
                    setFieldErrors((prev) => ({ ...prev, email: validateField('email', formData.email) }))
                  }}
                  className={fieldErrors.email && touched.email ? 'input-error' : ''}
                  required
                />
                {fieldErrors.email && touched.email && <p className="field-error">{fieldErrors.email}</p>}
              </div>
            </div>

            {/* Row 3: Skills (Full Width) */}
            <div className="form-group">
              <label>Skills (Comma separated)</label>
              <input
                type="text"
                name="skills"
                placeholder="React, Java, Design, Node"
                value={formData.skills}
                onChange={handleChange}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, skills: true }))
                  setFieldErrors((prev) => ({ ...prev, skills: validateField('skills', formData.skills) }))
                }}
                className={fieldErrors.skills && touched.skills ? 'input-error' : ''}
                required
              />
              {fieldErrors.skills && touched.skills && <p className="field-error">{fieldErrors.skills}</p>}
            </div>

            {/* Row 4: Passwords */}
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 8 chars"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, password: true }))
                    setFieldErrors((prev) => ({ ...prev, password: validateField('password', formData.password) }))
                  }}
                  className={fieldErrors.password && touched.password ? 'input-error' : ''}
                  required
                />
                {fieldErrors.password && touched.password && <p className="field-error">{fieldErrors.password}</p>}
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, confirmPassword: true }))
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData),
                    }))
                  }}
                  className={fieldErrors.confirmPassword && touched.confirmPassword ? 'input-error' : ''}
                  required
                />
                {fieldErrors.confirmPassword && touched.confirmPassword && (
                  <p className="field-error">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="form-footer-actions">
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, acceptTerms: true }))
                    setFieldErrors((prev) => ({ ...prev, acceptTerms: validateField('acceptTerms', formData.acceptTerms) }))
                  }}
                  required
                />
                <span>I agree to the Terms & Privacy Policy</span>
              </label>
              {fieldErrors.acceptTerms && touched.acceptTerms && <p className="field-error">{fieldErrors.acceptTerms}</p>}

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="register-footer">
            <p>Already have an account? <Link to="/login" className="login-link">Sign in here</Link></p>
          </div>
        </div>

        <div className="register-background">
          <div className="gradient-orb top"></div>
          <div className="gradient-orb bottom"></div>
        </div>
      </div>
    </div>
  )
}

export default Register