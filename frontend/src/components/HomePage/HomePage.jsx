import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './HomePage.css'

function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const syncAuthState = () => {
      const storedStudent = localStorage.getItem('currentStudent')
      const storedAdmin = localStorage.getItem('currentAdmin')
      setIsLoggedIn(Boolean(storedStudent || storedAdmin))
    }

    syncAuthState()
    window.addEventListener('storage', syncAuthState)
    window.addEventListener('logout', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('logout', syncAuthState)
    }
  }, [])

  return (
    <main className="home-page">
      <section className="hero-section" id="home">
        <div className="hero-content">
          <p className="eyebrow">Students. Creators. Leaders.</p>
          <h1>Build stronger campus communities together</h1>
          <p className="hero-subtext">
            Community Hub helps students discover events, share skills, and launch meaningful projects in one place.
          </p>
          {!isLoggedIn && (
            <div className="hero-actions">
              <Link to="/create-account" className="primary-cta">Create Your Account</Link>
              <Link to="/login" className="secondary-cta">Sign In</Link>
            </div>
          )}
        </div>
      </section>

      <section className="features-section" id="services">
        <div className="section-title">
          <h2>Everything You Need To Grow</h2>
          <p>
            Designed for student clubs, project teams, and campus communities.
          </p>
        </div>
        <div className="features-grid">
          <article className="feature-card">
            <h3>Event Management</h3>
            <p>Create, promote, and manage events with smart RSVPs and reminders.</p>
          </article>
          <article className="feature-card">
            <h3>Skill Marketplace</h3>
            <p>Connect with students by skills, interests, and collaboration goals.</p>
          </article>
          <article className="feature-card">
            <h3>Project Spaces</h3>
            <p>Run projects with focused discussion, tasks, and updates in one place.</p>
          </article>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-content">
          <h2>One Platform For Every Community</h2>
          <p>
            From coding clubs to volunteering groups, Community Hub removes the chaos of scattered chats and spreadsheets.
            Keep members engaged with clear communication, shared goals, and visible progress.
          </p>
        </div>
        <div className="about-tags">
          <span>Campus Clubs</span>
          <span>Hackathon Teams</span>
          <span>Volunteer Groups</span>
          <span>Mentor Circles</span>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div>
          <h2>Ready to launch your next community project?</h2>
          <p>Join now and start building impact with your team.</p>
        </div>
        {!isLoggedIn && <Link to="/create-account" className="primary-cta">Get Started Free</Link>}
      </section>
    </main>
  )
}

export default HomePage
