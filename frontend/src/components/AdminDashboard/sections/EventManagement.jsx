import { useState, useEffect } from 'react'
import { apiFetch } from '../../../services/apiClient'
import { showPopup } from '../../../utils/popup'

function EventManagement({ admin, onEventUpdated }) {
  const [events, setEvents] = useState([])
  const [view, setView] = useState('upcoming') // 'upcoming', 'past'
  const [loading, setLoading] = useState(true)
  const [showCreateEventForm, setShowCreateEventForm] = useState(false)
  const [formData, setFormData] = useState({
    eventName: '',
    venue: '',
    year: '',
    month: '',
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
    if (!formData.eventName || !formData.venue || !formData.year || !formData.month) {
      showPopup('error', 'Validation', 'Please fill all required fields')
      return
    }

    try {
      const response = await apiFetch('/events/create', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        showPopup('success', 'Success', 'Event created successfully!')
        setFormData({
          eventName: '',
          venue: '',
          year: '',
          month: '',
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
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
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

  return (
    <div className="event-management">
      <div className="section-header">
        <h2>📅 Event Management</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateEventForm(!showCreateEventForm)}>
          ➕ Create Event
        </button>
      </div>

      {/* Create Event Form */}
      {showCreateEventForm && (
        <div className="form-card">
          <h3>Create New Event</h3>
          <form onSubmit={handleCreateEvent}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Event Name"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Venue (e.g. University Main Playground)"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Year (e.g. 2026)"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                min="2026"
                max="2035"
                required
              />
              <input
                type="number"
                placeholder="Month (1-12)"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                min="1"
                max="12"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Event
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateEventForm(false)}>
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
              <p className="event-description">{event.eventPost || event.description}</p>
              <div className="event-details">
                <p>
                  📅 {new Date(event.startDate).toLocaleDateString()} -{' '}
                  {new Date(event.endDate).toLocaleDateString()}
                </p>
                <p>📍 {event.venue || event.location}</p>
                <p>👥 {event.registeredMembers}/{event.maxCapacity} registered</p>
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
