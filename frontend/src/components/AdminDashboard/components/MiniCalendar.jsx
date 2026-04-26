import { useState, useEffect } from 'react'
import { apiFetch } from '../../../services/apiClient'

function MiniCalendar() {
  const [events, setEvents] = useState([])
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const startDate = new Date(firstDay.setDate(firstDay.getDate() - firstDay.getDay()))
  const endDate = new Date(lastDay.setDate(lastDay.getDate() + (6 - lastDay.getDay())))

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await apiFetch('/events')
        const data = await response.json()
        if (response.ok && data.success) {
          setEvents(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch events:', err)
      }
    }

    loadEvents()
  }, [])

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const days = []
  const current = new Date(startDate)
  while (current <= endDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="mini-calendar">
      <div className="calendar-header">
        <h3>{monthNames[currentMonth]} {currentYear}</h3>
      </div>

      <div className="calendar-day-names">
        {dayNames.map((day) => (
          <div key={day} className="day-name">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {days.map((day, idx) => {
          const eventsOnDay = getEventsForDate(day)
          const isCurrentMonth = day.getMonth() === currentMonth
          const isToday =
            day.getDate() === now.getDate() &&
            day.getMonth() === now.getMonth() &&
            day.getFullYear() === now.getFullYear()

          return (
            <div
              key={idx}
              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${eventsOnDay.length > 0 ? 'has-event' : ''}`}
            >
              <span className="day-number">{day.getDate()}</span>
              {eventsOnDay.length > 0 && (
                <div className="event-indicator">
                  <span className="event-dot"></span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-today"></span>
          <p>Today</p>
        </div>
        <div className="legend-item">
          <span className="legend-event"></span>
          <p>Event</p>
        </div>
      </div>
    </div>
  )
}

export default MiniCalendar
