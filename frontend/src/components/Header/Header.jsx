import './Header.css'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { showPopup } from '../../utils/popup'
import { clearAuthData } from '../../services/apiClient'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profilePicture, setProfilePicture] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  useEffect(() => {
    const syncProfilePicture = () => {
      const storedStudent = localStorage.getItem('currentStudent')
      if (!storedStudent) {
        setProfilePicture('')
        setIsLoggedIn(false)
        return
      }

      try {
        const parsed = JSON.parse(storedStudent)
        setProfilePicture(parsed.profilePicture || '')
        setIsLoggedIn(true)
      } catch {
        setProfilePicture('')
        setIsLoggedIn(false)
      }
    }

    syncProfilePicture()
    window.addEventListener('storage', syncProfilePicture)
    window.addEventListener('student-profile-updated', syncProfilePicture)

    return () => {
      window.removeEventListener('storage', syncProfilePicture)
      window.removeEventListener('student-profile-updated', syncProfilePicture)
    }
  }, [])

  const handleLogout = () => {
    clearAuthData()
    setProfilePicture('')
    setIsLoggedIn(false)
    showPopup('Logged out successfully.', 'info')
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <span className="logo-icon">🌐</span>
          <Link to={isLoggedIn ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
            <h1>Community Hub</h1>
          </Link>
        </div>
        
        <nav className={`header-nav ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            <li><Link to="/" className="nav-link">Home</Link></li>
            {isLoggedIn && <li><Link to="/dashboard" className="nav-link">Communities</Link></li>}
            <li><a href="#about" className="nav-link">About</a></li>
            <li><a href="#services" className="nav-link">Services</a></li>
            <li><a href="#contact" className="nav-link">Contact</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <Link
            to={isLoggedIn ? '/edit-profile' : '/login'}
            className="profile-link"
            aria-label={isLoggedIn ? 'Edit Profile' : 'Go to Login'}
          >
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="profile-avatar" />
            ) : (
              <span>👤</span>
            )}
          </Link>
          {isLoggedIn ? (
            <button type="button" className="auth-btn logout-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="auth-btn login-btn">
                Sign In
              </Link>
              <Link to="/register" className="auth-btn register-btn">
                Sign Up
              </Link>
            </>
          )}
          <button 
            className={`hamburger ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
