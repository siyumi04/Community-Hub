import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { apiFetch } from '../../services/apiClient'
import './HomePage.css'

function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)

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

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setEventsLoading(true)
        const response = await apiFetch('/events/public?limit=6')
        const payload = await response.json()

        if (response.ok && payload.success) {
          setUpcomingEvents(payload.data || [])
        } else {
          setUpcomingEvents([])
        }
      } catch {
        setUpcomingEvents([])
      } finally {
        setEventsLoading(false)
      }
    }

    fetchUpcomingEvents()
  }, [])

  const formatEventDate = (dateValue) => {
    if (!dateValue) return 'Date TBD'
    return new Date(dateValue).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

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

      <section className="events-showcase-section" id="events">
        <div className="section-title">
          <h2>Upcoming Events From Campus Clubs</h2>
          <p>Freshly posted by club admins. Explore what is happening next and join what matches your interests.</p>
        </div>

        {eventsLoading ? (
          <div className="events-state-card">Loading upcoming events...</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="events-state-card">No upcoming events yet. Check back soon for new club announcements.</div>
        ) : (
          <div className="events-showcase-grid">
            {upcomingEvents.map((event) => (
              <article key={event._id} className="home-event-card">
                <div className="home-event-card-header">
                  <span className="home-event-badge">{event.category || 'Event'}</span>
                  <span className="home-event-club">{event.organizerName}</span>
                </div>
                <h3>{event.eventName}</h3>
                <p className="home-event-post">{event.eventPost || event.description}</p>
                <div className="home-event-meta">
                  <p>🗓️ {formatEventDate(event.startDate)}</p>
                  <p>📍 {event.venue || event.location || 'Venue TBD'}</p>
                  <p>👥 {event.registeredMembers || 0}/{event.maxCapacity || 0} seats filled</p>
                </div>
              </article>
            ))}
          </div>
        )}
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
