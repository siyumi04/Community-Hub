import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Register.css'

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          itNumber: formData.itNumber,
          email: formData.email,
          password: formData.password,
          skills: formData.skills.split(',').map(s => s.trim()), 
        }),
      })

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
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
            {error && <div className="error-message">{error}</div>}

            {/* Row 1: Names */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            {/* Row 2: IT Number & Email */}
            <div className="form-row">
              <div className="form-group">
                <label>IT Number</label>
                <input type="text" name="itNumber" placeholder="IT21XXXXXX" value={formData.itNumber} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Row 3: Skills (Full Width) */}
            <div className="form-group">
              <label>Skills (Comma separated)</label>
              <input type="text" name="skills" placeholder="React, Java, Design, Node" value={formData.skills} onChange={handleChange} required />
            </div>

            {/* Row 4: Passwords */}
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="At least 8 chars" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" placeholder="Confirm" value={formData.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-footer-actions">
              <label className="terms-checkbox">
                <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} required />
                <span>I agree to the Terms & Privacy Policy</span>
              </label>

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