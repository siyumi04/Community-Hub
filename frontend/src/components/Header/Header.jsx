import './Header.css'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { showPopup } from '../../utils/popup'
import { clearAuthData } from '../../services/apiClient'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profilePicture, setProfilePicture] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [accountType, setAccountType] = useState('guest')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
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

  // Force dark mode globally
  useEffect(() => {
    localStorage.setItem('theme', 'dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  useEffect(() => {
    const syncSessionState = () => {
      const storedStudent = localStorage.getItem('currentStudent')
      if (storedStudent) {
        try {
          const parsed = JSON.parse(storedStudent)
          setProfilePicture(parsed.profilePicture || '')
          setIsLoggedIn(true)
          setAccountType('student')
          return
        } catch {
          // Continue to admin/guest fallback if student data is malformed.
        }
      }

      const storedAdmin = localStorage.getItem('currentAdmin')
      if (storedAdmin) {
        setProfilePicture('')
        setIsLoggedIn(true)
        setAccountType('admin')
        return
      }

      setProfilePicture('')
      setIsLoggedIn(false)
      setAccountType('guest')
    }

    syncSessionState()
    window.addEventListener('storage', syncSessionState)
    window.addEventListener('student-profile-updated', syncSessionState)
    window.addEventListener('admin-profile-updated', syncSessionState)
    window.addEventListener('logout', syncSessionState)

    return () => {
      window.removeEventListener('storage', syncSessionState)
      window.removeEventListener('student-profile-updated', syncSessionState)
      window.removeEventListener('admin-profile-updated', syncSessionState)
      window.removeEventListener('logout', syncSessionState)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleLogout = () => {
    clearAuthData()
    localStorage.removeItem('currentAdmin')
    localStorage.removeItem('currentStudent')
    setProfilePicture('')
    setIsLoggedIn(false)
    setAccountType('guest')
    showPopup('Logged out successfully.', 'info')
    navigate('/')
  }

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="header-logo">
          <span className="logo-icon">🌐</span>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1>Community Hub</h1>
          </Link>
        </div>
        
        <nav className={`header-nav ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            <li>
              <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Home
              </NavLink>
            </li>
            {isLoggedIn && (
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                  Communities
                </NavLink>
              </li>
            )}
            {isLoggedIn && (
              <li>
                <NavLink to="/notice-summarizer" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                  Notices
                </NavLink>
              </li>
            )}
            <li><a href="#about" className="nav-link">About</a></li>
            <li><a href="#services" className="nav-link">Services</a></li>
            <li><a href="#contact" className="nav-link">Contact</a></li>
          </ul>
        </nav>

        <div className="header-actions">
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
                  {accountType === 'student' && (
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setIsDropdownOpen(false)
                        navigate('/edit-profile')
                      }}
                    >
                      Edit Profile
                    </button>
                  )}
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
