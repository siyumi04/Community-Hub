import { useState, useEffect } from 'react'
import { apiFetch } from '../../services/apiClient'

const resolveCommunityIdFromDashboard = (dashboardName = '') => {
  const normalized = String(dashboardName).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.includes('cricket')) return 'cricket'
  if (normalized.includes('hockey')) return 'hockey'
  if (normalized.includes('environmental') || normalized.includes('enviromental')) return 'environmental'
  if (normalized.includes('foc')) return 'foc'
  if (normalized.includes('food')) return 'food'
  return ''
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatWeekdayDay = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBA'
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const daysUntil = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
  return Number.isFinite(diff) ? diff : null
}

const NoticeBoard = ({ communityId = '' }) => {
  const [eventPosts, setEventPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEventPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiFetch(`/events/public?communityId=${encodeURIComponent(communityId)}&limit=12`)
        const data = await response.json()

        if (response.ok && data.success) {
          const incoming = Array.isArray(data.data) ? data.data : []
          const filtered = incoming.filter((event) => {
            const eventCommunityId =
              event.organizerCommunityId ||
              resolveCommunityIdFromDashboard(event.organizerName || '')
            return eventCommunityId && eventCommunityId === communityId
          })
          setEventPosts(filtered)
        } else {
          setError(data.message || 'Failed to load event posts')
        }
      } catch {
        setError('Unable to connect to server')
      } finally {
        setLoading(false)
      }
    }

    if (!communityId) {
      setEventPosts([])
      setLoading(false)
      return
    }

    fetchEventPosts()
  }, [communityId])

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Event Posts</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-indigo-300 text-sm animate-pulse">Loading event posts...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Event Posts</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (eventPosts.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Event Posts</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400 text-sm">No event posts available for this community.</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 bg-indigo-400 rounded-full" />
        <h2 className="text-2xl font-bold text-white tracking-tight">Event Posts</h2>
        <span className="ml-auto text-xs text-indigo-400 font-medium bg-indigo-500/10 px-3 py-1 rounded-full">
          {eventPosts.length} {eventPosts.length === 1 ? 'post' : 'posts'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {eventPosts.slice(0, 6).map((event) => {
          const remainingDays = daysUntil(event.startDate)
          return (
            <div
              key={event._id}
              className="rounded-2xl overflow-hidden border border-cyan-400/35 shadow-lg transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl"
              style={{ background: 'linear-gradient(160deg, rgba(10, 35, 56, 0.95), rgba(14, 30, 78, 0.92))' }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl leading-none">🎯</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-3 py-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 text-emerald-300 font-semibold">
                      Club Event
                    </span>
                    <span className="text-[11px] px-3 py-1 rounded-full border border-blue-300/40 bg-blue-400/10 text-blue-200 font-semibold">
                      {remainingDays === null ? 'Upcoming' : remainingDays <= 0 ? 'Today' : `In ${remainingDays} days`}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold text-white mt-3 leading-tight">
                  {event.eventName}
                </h3>
                <p className="text-sky-200/90 text-sm mt-1">
                  {event.category || 'Community Event'}
                </p>

                <div className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-300/5 px-4 py-3">
                  <p className="text-cyan-100/90 text-sm italic">
                    {event.eventPost || event.description || 'Join this event and connect with your community members.'}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-4 text-slate-200/95 text-sm font-medium">
                  <span>🗓️ {formatWeekdayDay(event.startDate)}</span>
                  <span>⏰ {formatTime(event.startDate)}</span>
                </div>

                <p className="text-slate-300/70 text-xs mt-2">
                  {formatDate(event.startDate)}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-400/20 flex items-center justify-between text-sm text-slate-300/85">
                  <span>📍 {event.venue || event.location || 'Venue TBA'}</span>
                  <span>👥 {event.registeredMembers || 0}/{event.maxCapacity || 150}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NoticeBoard
