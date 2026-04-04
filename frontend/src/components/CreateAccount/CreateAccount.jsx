import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './CreateAccount.css'
import { showPopup } from '../../utils/popup'
import { apiFetch, setAuthToken } from '../../services/apiClient'

const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]{1,29}$/
const IT_NUMBER_PATTERN = /^IT\d{2}[A-Za-z0-9]{6}$/
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const DASHBOARD_NAME_PATTERN = /^[a-z0-9_-]{3,30}$/i
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/

function CreateAccount() {
  const [activeTab, setActiveTab] = useState('student')
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

  // Admin Form State
  const [adminForm, setAdminForm] = useState({
    firstName: '',
    lastName: '',
    itNumber: '',
    email: '',
    dashboardName: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

  const [adminErrors, setAdminErrors] = useState({
    firstName: '',
    lastName: '',
    itNumber: '',
    email: '',
    dashboardName: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

  const [adminTouched, setAdminTouched] = useState({
    firstName: false,
    lastName: false,
    itNumber: false,
    email: false,
    dashboardName: false,
    username: false,
    password: false,
    confirmPassword: false,
  })

  const [studentLoading, setStudentLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)

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

  // ==================== ADMIN VALIDATION ====================
  const validateAdminField = (name, value, currentForm = adminForm) => {
    if (name === 'firstName' || name === 'lastName') {
      const normalized = String(value).trim()
      if (!normalized) return 'This field is required.'
      if (!NAME_PATTERN.test(normalized)) return 'Use 2-30 letters only.'
      return ''
    }

    if (name === 'itNumber') {
      const normalized = String(value).trim().toUpperCase()
      if (!normalized) return 'IT Number is required.'
      if (!IT_NUMBER_PATTERN.test(normalized)) return 'Format: IT##XXXXXX (e.g., IT24CS001)'
      return ''
    }

    if (name === 'email') {
      const normalized = String(value).trim().toLowerCase()
      if (!normalized) return 'Email is required.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'Enter a valid email.'
      return ''
    }

    if (name === 'dashboardName') {
      const normalized = String(value).trim()
      if (!normalized) return 'Dashboard name is required.'
      if (!DASHBOARD_NAME_PATTERN.test(normalized)) return 'Use 3-30 characters (letters, numbers, hyphens, underscores).'
      return ''
    }

    if (name === 'username') {
      const normalized = String(value).trim()
      if (!normalized) return 'Username is required.'
      if (!USERNAME_PATTERN.test(normalized)) return 'Use 3-30 characters (letters, numbers, hyphens, underscores).'
      return ''
    }

    if (name === 'password') {
      const normalized = String(value).trim()
      if (!normalized) return 'Password is required.'
      if (!PASSWORD_PATTERN.test(normalized)) {
        return 'Password must be 7 characters: exactly 5 digits and 2 letters (e.g., 12345ab)'
      }
      return ''
    }

    if (name === 'confirmPassword') {
      const password = String(currentForm.password).trim()
      const confirmed = String(value).trim()
      if (!confirmed) return 'Please confirm your password.'
      if (password !== confirmed) return 'Passwords do not match.'
      return ''
    }

    return ''
  }

  const handleAdminChange = (e) => {
    const { name, value } = e.target
    setAdminForm((prev) => ({ ...prev, [name]: value }))
    if (adminTouched[name]) {
      setAdminErrors((prev) => ({
        ...prev,
        [name]: validateAdminField(name, value, { ...adminForm, [name]: value }),
      }))
    }
  }

  const handleAdminBlur = (e) => {
    const { name } = e.target
    setAdminTouched((prev) => ({ ...prev, [name]: true }))
    setAdminErrors((prev) => ({
      ...prev,
      [name]: validateAdminField(name, adminForm[name]),
    }))
  }

  const validateAllAdmin = () => {
    const nextErrors = {
      firstName: validateAdminField('firstName', adminForm.firstName),
      lastName: validateAdminField('lastName', adminForm.lastName),
      itNumber: validateAdminField('itNumber', adminForm.itNumber),
      email: validateAdminField('email', adminForm.email),
      dashboardName: validateAdminField('dashboardName', adminForm.dashboardName),
      username: validateAdminField('username', adminForm.username),
      password: validateAdminField('password', adminForm.password),
      confirmPassword: validateAdminField('confirmPassword', adminForm.confirmPassword),
    }
    setAdminErrors(nextErrors)
    return Object.values(nextErrors).every((value) => !value)
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    setAdminTouched({
      firstName: true,
      lastName: true,
      itNumber: true,
      email: true,
      dashboardName: true,
      username: true,
      password: true,
      confirmPassword: true,
    })

    if (!validateAllAdmin()) {
      showPopup('error', 'Validation Failed', 'Please fix all errors before submitting.')
      return
    }

    setAdminLoading(true)

    try {
      const normalizedData = {
        firstName: adminForm.firstName.trim(),
        lastName: adminForm.lastName.trim(),
        itNumber: adminForm.itNumber.trim().toUpperCase(),
        email: adminForm.email.trim().toLowerCase(),
        dashboardName: adminForm.dashboardName.trim(),
        username: adminForm.username.trim(),
        password: adminForm.password.trim(),
        confirmPassword: adminForm.confirmPassword.trim(),
      }

      const response = await apiFetch('/admins/register', {
        method: 'POST',
        body: JSON.stringify(normalizedData),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Registration failed')

      if (data.success) {
        setAuthToken(data.data.token)
        localStorage.setItem('currentAdmin', JSON.stringify(data.data.admin))

        showPopup('success', 'Admin Account Created!', 'Your admin account has been created successfully!')

        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (error) {
      showPopup('error', 'Error', error.message || 'An error occurred during registration.')
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="create-account-container">
      <div className="create-account-card">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <span className="tab-icon">👤</span>
            Student Account
          </button>
        </div>

        {/* Student Tab */}
        {activeTab === 'student' && (
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
        )}

      </div>
    </div>
  )
}

export default CreateAccount
