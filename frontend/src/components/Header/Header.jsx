import './Header.css'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { showPopup } from '../../utils/popup'
import { clearAuthData } from '../../services/apiClient'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profilePicture, setProfilePicture] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [theme, setTheme] = useState('dark')
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

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
          <button 
            className="theme-toggle" 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {isLoggedIn ? (
            <div className="profile-dropdown-container">
              <button
                className="profile-link"
                onClick={toggleDropdown}
                aria-label="Profile Menu"
              >
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="profile-avatar" />
                ) : (
                  <span>👤</span>
                )}
              </button>
              {isDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      navigate('/edit-profile')
                    }}
                  >
                    Edit Profile
                  </button>
                  <button 
                    className="dropdown-item logout-item"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      handleLogout()
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="profile-link"
              aria-label="Go to Login"
            >
              <span>👤</span>
            </Link>
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
