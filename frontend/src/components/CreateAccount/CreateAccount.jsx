import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './CreateAccount.css'
import { showPopup } from '../../utils/popup'
import { apiFetch } from '../../services/apiClient'

const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]{1,29}$/
const IT_NUMBER_PATTERN = /^IT\d{2}[A-Za-z0-9]{6}$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

function CreateAccount() {
  const navigate = useNavigate()

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    itNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    skills: '',
    acceptTerms: false,
  })

  const [studentErrors, setStudentErrors] = useState({
    firstName: '',
    lastName: '',
    itNumber: '',
    email: '',
    skills: '',
    password: '',
    confirmPassword: '',
    acceptTerms: '',
  })

  const [studentTouched, setStudentTouched] = useState({
    firstName: false,
    lastName: false,
    itNumber: false,
    email: false,
    skills: false,
    password: false,
    confirmPassword: false,
    acceptTerms: false,
  })

  const [studentLoading, setStudentLoading] = useState(false)

  // ==================== STUDENT VALIDATION ====================
  const validateStudentField = (name, value, currentForm = studentForm) => {
    if (name === 'firstName' || name === 'lastName') {
      const normalized = String(value).trim()
      if (!normalized) return 'This field is required.'
      if (!NAME_PATTERN.test(normalized)) return 'Use 2-30 letters only.'
      return ''
    }

    if (name === 'itNumber') {
      const normalized = String(value).trim().toUpperCase()
      if (!normalized) return 'IT Number is required.'
      if (!IT_NUMBER_PATTERN.test(normalized)) return 'Format should be like IT21XXXXXX.'
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

  const handleStudentChange = (e) => {
    const { name, value, type, checked } = e.target
    const nextValue = type === 'checkbox' ? checked : value
    setStudentForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }))

    if (studentTouched[name]) {
      setStudentErrors((prev) => ({
        ...prev,
        [name]: validateStudentField(name, nextValue, { ...studentForm, [name]: nextValue }),
      }))
    }

    if (name === 'password' && studentTouched.confirmPassword) {
      const nextForm = { ...studentForm, password: value }
      setStudentErrors((prev) => ({
        ...prev,
        confirmPassword: validateStudentField('confirmPassword', nextForm.confirmPassword, nextForm),
      }))
    }
  }

  const handleStudentBlur = (e) => {
    const { name } = e.target
    setStudentTouched((prev) => ({ ...prev, [name]: true }))
    setStudentErrors((prev) => ({
      ...prev,
      [name]: validateStudentField(name, studentForm[name]),
    }))
  }

  const validateAllStudent = () => {
    const nextErrors = {
      firstName: validateStudentField('firstName', studentForm.firstName),
      lastName: validateStudentField('lastName', studentForm.lastName),
      itNumber: validateStudentField('itNumber', studentForm.itNumber),
      email: validateStudentField('email', studentForm.email),
      skills: validateStudentField('skills', studentForm.skills),
      password: validateStudentField('password', studentForm.password),
      confirmPassword: validateStudentField('confirmPassword', studentForm.confirmPassword, studentForm),
      acceptTerms: validateStudentField('acceptTerms', studentForm.acceptTerms),
    }
    setStudentErrors(nextErrors)
    return Object.values(nextErrors).every((value) => !value)
  }

  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    setStudentTouched({
      firstName: true,
      lastName: true,
      itNumber: true,
      email: true,
      skills: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true,
    })

    if (!validateAllStudent()) {
      showPopup('error', 'Validation Failed', 'Please fix all errors before submitting.')
      return
    }

    setStudentLoading(true)

    try {
      const firstName = studentForm.firstName.trim()
      const lastName = studentForm.lastName.trim()
      const itNumber = studentForm.itNumber.trim().toUpperCase()
      const email = studentForm.email.trim().toLowerCase()
      const skills = studentForm.skills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const response = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          itNumber,
          email,
          password: studentForm.password,
          skills,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Registration failed')

      showPopup('success', 'Success', 'Student account created! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      showPopup('error', 'Error', err.message || 'Registration failed. Please try again.')
    } finally {
      setStudentLoading(false)
    }
  }

  return (
    <div className="create-account-container">
      <div className="create-account-card">

        {/* Student Registration */}
        <div className="tab-content student-tab">
          <div className="tab-header">
            <h1>Student Registration</h1>
            <p>Create your student account and join the community</p>
          </div>

          <form onSubmit={handleStudentSubmit} className="register-form">
            {/* Row 1: Names */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={studentForm.firstName}
                  onChange={handleStudentChange}
                  onBlur={handleStudentBlur}
                  className={studentErrors.firstName && studentTouched.firstName ? 'input-error' : ''}
                  required
                />
                {studentErrors.firstName && studentTouched.firstName && (
                  <p className="field-error">{studentErrors.firstName}</p>
                )}
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={studentForm.lastName}
                  onChange={handleStudentChange}
                  onBlur={handleStudentBlur}
                  className={studentErrors.lastName && studentTouched.lastName ? 'input-error' : ''}
                  required
                />
                {studentErrors.lastName && studentTouched.lastName && (
                  <p className="field-error">{studentErrors.lastName}</p>
                )}
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
                  value={studentForm.itNumber}
                  onChange={handleStudentChange}
                  onBlur={handleStudentBlur}
                  className={studentErrors.itNumber && studentTouched.itNumber ? 'input-error' : ''}
                  required
                />
                {studentErrors.itNumber && studentTouched.itNumber && (
                  <p className="field-error">{studentErrors.itNumber}</p>
                )}
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={studentForm.email}
                  onChange={handleStudentChange}
                  onBlur={handleStudentBlur}
                  className={studentErrors.email && studentTouched.email ? 'input-error' : ''}
                  required
                />
                {studentErrors.email && studentTouched.email && (
                  <p className="field-error">{studentErrors.email}</p>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="form-group">
              <label>Skills (Comma separated)</label>
              <input
                type="text"
                name="skills"
                placeholder="React, Java, Design, Node"
                value={studentForm.skills}
                onChange={handleStudentChange}
                onBlur={handleStudentBlur}
                className={studentErrors.skills && studentTouched.skills ? 'input-error' : ''}
                required
              />
              {studentErrors.skills && studentTouched.skills && (
                <p className="field-error">{studentErrors.skills}</p>
              )}
            </div>

            {/* Passwords */}
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 8 chars"
                  value={studentForm.password}
                  onChange={handleStudentChange}
                  onBlur={handleStudentBlur}
                  className={studentErrors.password && studentTouched.password ? 'input-error' : ''}
                  required
                />
                {studentErrors.password && studentTouched.password && (
                  <p className="field-error">{studentErrors.password}</p>
                )}
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm"
                  value={studentForm.confirmPassword}
                  onChange={handleStudentChange}
                  onBlur={handleStudentBlur}
                  className={studentErrors.confirmPassword && studentTouched.confirmPassword ? 'input-error' : ''}
                  required
                />
                {studentErrors.confirmPassword && studentTouched.confirmPassword && (
                  <p className="field-error">{studentErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="form-footer-actions">
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={studentForm.acceptTerms}
                  onChange={handleStudentChange}
                  onBlur={handleStudentBlur}
                  required
                />
                <span>I agree to the Terms & Privacy Policy</span>
              </label>
              {studentErrors.acceptTerms && studentTouched.acceptTerms && (
                <p className="field-error">{studentErrors.acceptTerms}</p>
              )}

              <button type="submit" className="register-btn" disabled={studentLoading}>
                {studentLoading ? 'Creating Account...' : 'Create Student Account'}
              </button>
            </div>
          </form>

          <div className="tab-footer">
            <p>Already have an account? <Link to="/login" className="login-link">Sign in here</Link></p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default CreateAccount
