import { useState, useEffect } from 'react'
import { apiFetch } from '../../../services/apiClient'
import { showPopup, showConfirm } from '../../../utils/popup'

function EventManagement({ admin, onEventUpdated }) {
  const [events, setEvents] = useState([])
  const [view, setView] = useState('upcoming') // 'upcoming', 'past'
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateEventForm, setShowCreateEventForm] = useState(false)
  const [formData, setFormData] = useState({
    eventName: '',
    venue: '',
    date: '',
    time: '',
  })

  useEffect(() => {
    fetchEvents()
  }, [view])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const status = view === 'upcoming' ? 'upcoming' : 'completed'
      const response = await apiFetch(`/events?status=${status}`)
      const data = await response.json()
      if (response.ok && data.success) {
        setEvents(data.data)
      }
    } catch (err) {
      showPopup('error', 'Error', 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!formData.eventName || !formData.venue || !formData.date || !formData.time) {
      showPopup('error', 'Validation', 'Please fill all required fields')
      return
    }

    try {
      setCreating(true)
      const response = await apiFetch('/events/create', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        showPopup('success', 'Success', 'Event created with AI-generated details!')
        setFormData({
          eventName: '',
          venue: '',
          date: '',
          time: '',
        })
        setShowCreateEventForm(false)
        await fetchEvents()
        if (typeof onEventUpdated === 'function') {
          onEventUpdated()
        }
      } else {
        showPopup('error', 'Error', data.message)
      }
    } catch (err) {
      showPopup('error', 'Error', 'Failed to create event')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    const confirmed = await showConfirm({
      title: 'Delete Event?',
      text: 'Are you sure you want to delete this event?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'warning',
    })
    if (!confirmed) return

    try {
      const response = await apiFetch(`/events/${eventId}`, { method: 'DELETE' })
      if (response.ok) {
        showPopup('success', 'Success', 'Event deleted!')
        await fetchEvents()
        if (typeof onEventUpdated === 'function') {
          onEventUpdated()
        }
      }
    } catch (err) {
      showPopup('error', 'Error', 'Failed to delete event')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  return (
    <div className="event-management">
      <div className="section-header">
        <h2>📅 Event Management</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateEventForm(!showCreateEventForm)}>
          ➕ Create AI Event
        </button>
      </div>

      {/* Create Event Form */}
      {showCreateEventForm && (
        <div className="form-card ai-form-card">
          <div className="ai-form-header">
            <span className="ai-sparkle-icon">✨</span>
            <div>
              <h3>Create AI-Powered Event</h3>
              <p className="ai-form-subtitle">
                Enter basic details — our AI will generate the best date & event post automatically
              </p>
            </div>
          </div>
          <form onSubmit={handleCreateEvent}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Event Name (e.g. Annual Cricket Match)"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                required
                disabled={creating}
              />
              <input
                type="text"
                placeholder="Venue (e.g. University Main Playground)"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                required
                disabled={creating}
              />
            </div>
            <div className="form-row">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={creating}
              />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                disabled={creating}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? (
                  <span className="ai-creating-label">
                    <span className="ai-spinner"></span>
                    AI is generating...
                  </span>
                ) : (
                  '🤖 Generate & Create Event'
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateEventForm(false)}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Tabs */}
      <div className="tabs">
        <button className={`tab ${view === 'upcoming' ? 'active' : ''}`} onClick={() => setView('upcoming')}>
          Upcoming Events
        </button>
        <button className={`tab ${view === 'past' ? 'active' : ''}`} onClick={() => setView('past')}>
          Past Events
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <p className="loading">Loading events...</p>
      ) : events.length > 0 ? (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event._id} className="event-card">
              <div className="event-header">
                <h3>{event.eventName}</h3>
                <span className={`badge badge-${event.eventStatus}`}>{event.eventStatus}</span>
              </div>
              <p className="event-category">{event.category}</p>

              {/* AI Generated Content Section */}
              <div className="ai-generated-section">
                <div className="ai-badge-row">
                  <span className="ai-badge">
                    <span className="ai-badge-dot"></span>
                    🤖 AI Generated
                  </span>
                </div>

                {/* AI-Generated Event Post */}
                <div className="ai-event-post">
                  <div className="ai-post-label">
                    <span className="ai-icon">✨</span> AI Event Post
                  </div>
                  <p className="ai-post-text">{event.eventPost || event.description}</p>
                </div>

                {/* AI-Suggested Date & Time */}
                <div className="ai-suggested-date">
                  <div className="ai-post-label">
                    <span className="ai-icon">📅</span> AI Suggested Date & Time
                  </div>
                  <p className="ai-date-text">{formatDate(event.suggestedDate)}</p>
                </div>
              </div>

              <div className="event-details">
                <p>📅 {formatDate(event.startDate)} — {formatDate(event.endDate)}</p>
                <p>📍 {event.venue || event.location}</p>
                <p>👥 {event.registeredMembers}/{event.maxCapacity} registered</p>
                {event.month && event.year && (
                  <p>🗓️ Planned for {monthNames[event.month]} {event.year}</p>
                )}
              </div>
              <div className="event-actions">
                <button className="btn btn-primary btn-sm">✓ Mark Attended</button>
                <button className="btn btn-secondary btn-sm">QR Code</button>
                <button className="btn btn-secondary btn-sm">Feedback</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(event._id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">No events found</p>
      )}
    </div>
  )
}

export default EventManagement
