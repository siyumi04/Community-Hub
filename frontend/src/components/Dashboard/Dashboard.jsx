import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'
import { apiFetch } from '../../services/apiClient'
import community01 from '../../assets/ITPM images/Community01.jpg'
import community02 from '../../assets/ITPM images/Community02.jpg'
import community03 from '../../assets/ITPM images/Community03.jpg'
import community04 from '../../assets/ITPM images/Community04.jpg'
import community05 from '../../assets/ITPM images/Community05.jpg'
import logo01 from '../../assets/ITPM images/logo01.png'
import logo02 from '../../assets/ITPM images/logo02.png'
import logo03 from '../../assets/ITPM images/logo03.png'
import logo04 from '../../assets/ITPM images/logo04.png'
import logo05 from '../../assets/ITPM images/logo05.png'

const communities = [
  {
    id: 'cricket',
    name: 'Cricket Club',
    description: 'Practice sessions, tournaments, and player development for cricket lovers.',
    tag: 'Sports',
    cover: community01,
    logo: logo01,
  },
  {
    id: 'hockey',
    name: 'Hockey Club',
    description: 'Build teamwork and fitness through competitive and friendly hockey events.',
    tag: 'Sports',
    cover: community02,
    logo: logo02,
  },
  {
    id: 'environmental',
    name: 'Environmental Community',
    description: 'Lead sustainability projects, cleanups, and awareness campaigns on campus.',
    tag: 'Sustainability',
    cover: community03,
    logo: logo03,
  },
  {
    id: 'foc',
    name: 'FOC Event Club',
    description: 'Plan and organize Faculty of Computing events with creative student teams.',
    tag: 'Events',
    cover: community04,
    logo: logo04,
  },
  {
    id: 'food',
    name: 'Food & Beverages Community',
    description: 'Discover recipes, food culture, and host tasting sessions with friends.',
    tag: 'Lifestyle',
    cover: community05,
    logo: logo05,
  },
]

// Fallback hardcoded events (used when no DB events are available)
const fallbackEvents = [
  {
    title: 'Campus Cricket Strategy Session',
    club: 'Cricket Club',
    dayOfWeek: 1,
    time: '5:30 PM',
    icon: '🏏',
    requiredSkills: ['cricket', 'teamwork', 'leadership'],
  },
  {
    title: 'Hockey Fitness Bootcamp',
    club: 'Hockey Club',
    dayOfWeek: 2,
    time: '6:00 PM',
    icon: '🏑',
    requiredSkills: ['hockey', 'fitness', 'teamwork'],
  },
  {
    title: 'Green Campus Cleanup Drive',
    club: 'Environmental Community',
    dayOfWeek: 3,
    time: '4:30 PM',
    icon: '🌿',
    requiredSkills: ['environment', 'sustainability', 'community'],
  },
  {
    title: 'FOC Event Planning Sprint',
    club: 'FOC Event Club',
    dayOfWeek: 4,
    time: '3:00 PM',
    icon: '🎯',
    requiredSkills: ['event', 'coordination', 'design', 'communication'],
  },
  {
    title: 'Campus Food Fest Preparation',
    club: 'Food & Beverages Community',
    dayOfWeek: 5,
    time: '2:00 PM',
    icon: '🍜',
    requiredSkills: ['food', 'beverages', 'hospitality', 'marketing'],
  },
  {
    title: 'Campus Cooking Workshop',
    club: 'Food & Beverages Community',
    dayOfWeek: 6,
    time: '10:00 AM',
    icon: '🍳',
    requiredSkills: ['cooking', 'culinary', 'food', 'nutrition'],
  },
]

// Category-to-icon mapping for AI events from DB
const categoryIcons = {
  Sports: '🏆',
  Cultural: '🎭',
  Academic: '📚',
  Social: '🤝',
  Technical: '💻',
  Competition: '🏅',
  Workshop: '🔧',
  Other: '🎯',
}

/** Returns the next real calendar date for a given weekday (0-6) */
function getNextDate(targetDay) {
  const today = new Date()
  const todayDay = today.getDay()
  let daysAhead = targetDay - todayDay
  if (daysAhead <= 0) daysAhead += 7
  const next = new Date(today)
  next.setDate(today.getDate() + daysAhead)
  return next
}

/** Returns "Today", "Tomorrow", or "Wed, Apr 9" etc. */
function formatEventDate(date) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Returns days until event */
function daysUntil(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date - today) / (1000 * 60 * 60 * 24))
  return diff
}

function Dashboard() {
  const navigate = useNavigate()
  const [studentSkills, setStudentSkills] = useState([])
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [joinedCommunities, setJoinedCommunities] = useState([])

  // AI recommendation state
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [isAiPowered, setIsAiPowered] = useState(false)

  useEffect(() => {
    const syncSkills = () => {
      const storedStudent = localStorage.getItem('currentStudent')
      if (!storedStudent) {
        setStudentSkills([])
        setStudentName('')
        setStudentId('')
        setJoinedCommunities([])
        return
      }

      try {
        const parsed = JSON.parse(storedStudent)
        const skills = Array.isArray(parsed.skills)
          ? parsed.skills
          : String(parsed.skills || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
        setStudentSkills(skills)
        setStudentName(parsed.name ? parsed.name.split(' ')[0] : '')
        setStudentId(parsed._id || '')
        setJoinedCommunities(
          Array.isArray(parsed.joinedCommunities)
            ? parsed.joinedCommunities.map((c) => c.communityName || c.communityId)
            : []
        )
      } catch {
        setStudentSkills([])
      }
    }

    syncSkills()
    window.addEventListener('student-profile-updated', syncSkills)
    return () => window.removeEventListener('student-profile-updated', syncSkills)
  }, [])

  // Fetch AI recommendations when student ID is available
  useEffect(() => {
    if (!studentId) return

    const fetchRecommendations = async () => {
      setAiLoading(true)
      setAiError('')
      try {
        const response = await apiFetch(`/recommendations/${studentId}`)
        const data = await response.json()

        if (response.ok && data.success && data.data?.length > 0) {
          setAiRecommendations(data.data)
          setIsAiPowered(true)
        } else {
          setAiRecommendations([])
          setIsAiPowered(false)
        }
      } catch (err) {
        console.error('Failed to fetch AI recommendations:', err)
        setAiError('Could not load AI recommendations')
        setIsAiPowered(false)
      } finally {
        setAiLoading(false)
      }
    }

    fetchRecommendations()
  }, [studentId])

  // Enrich fallback events with dynamic dates (for when no DB events exist)
  const enrichedFallbackEvents = useMemo(
    () =>
      fallbackEvents.map((ev) => {
        const date = getNextDate(ev.dayOfWeek)
        return {
          ...ev,
          nextDate: date,
          dateLabel: formatEventDate(date),
          daysAway: daysUntil(date),
          fullDate: date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
        }
      }),
    []
  )

  // Fallback: filter by skills when no AI events
  const fallbackRecommended = useMemo(() => {
    const normalizedSkills = studentSkills.map((skill) => skill.toLowerCase())
    if (normalizedSkills.length === 0) return []

    return enrichedFallbackEvents.filter((event) =>
      event.requiredSkills.some((skill) => normalizedSkills.includes(skill.toLowerCase()))
    )
  }, [studentSkills, enrichedFallbackEvents])

  // Determine what events to show
  const showAiEvents = isAiPowered && aiRecommendations.length > 0
  const fallbackDisplay =
    fallbackRecommended.length > 0 ? fallbackRecommended : enrichedFallbackEvents.slice(0, 3)
  const isPersonalized = showAiEvents || fallbackRecommended.length > 0

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <p className="dashboard-eyebrow">Student Communities</p>
        <h1>
          {studentName ? `Welcome back, ${studentName} 👋` : 'Welcome to Your Communities'}
        </h1>
        <p>Explore communities and join the clubs that match your passion.</p>
      </section>

      {/* ── AI-Powered Recommendations Section ── */}
      <section className="recommendation-section">
        <div className="recommendation-header">
          <div className="rec-title-row">
            <h2>
              {showAiEvents
                ? '🤖 AI-Recommended Events For You'
                : isPersonalized
                  ? '✨ Recommended Events For You'
                  : 'Upcoming Events'}
            </h2>
            {showAiEvents && (
              <span className="rec-badge ai-badge">
                <span className="ai-sparkle">✦</span> AI Powered
              </span>
            )}
            {!showAiEvents && isPersonalized && (
              <span className="rec-badge">Based on your skills</span>
            )}
          </div>

          {/* Skills & Communities tags */}
          {studentSkills.length > 0 || joinedCommunities.length > 0 ? (
            <div className="profile-context">
              {studentSkills.length > 0 && (
                <div className="context-group">
                  <span className="context-label">Your Skills</span>
                  <div className="skill-list">
                    {studentSkills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {joinedCommunities.length > 0 && (
                <div className="context-group">
                  <span className="context-label">Your Communities</span>
                  <div className="community-tag-list">
                    {joinedCommunities.map((name) => (
                      <span key={name} className="community-interest-tag">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="no-skill-text">
              💡 Add skills in your profile and join communities to get personalized AI event
              recommendations.
            </p>
          )}
        </div>

        {/* Loading state */}
        {aiLoading && (
          <div className="ai-loading">
            <div className="ai-loading-spinner" />
            <p>AI is analyzing your profile and finding the best events...</p>
          </div>
        )}

        {/* Error state */}
        {aiError && !aiLoading && (
          <div className="ai-error-banner">
            <span>⚠️</span> {aiError}
          </div>
        )}

        {/* AI Recommended Events from Database */}
        {showAiEvents && !aiLoading && (
          <div className="event-list">
            {aiRecommendations.map((event) => {
              const eventDate = new Date(event.startDate)
              const days = daysUntil(eventDate)
              const dateLabel = formatEventDate(eventDate)
              const icon = categoryIcons[event.category] || '🎯'

              return (
                <article className="event-card ai-event-card" key={event._id}>
                  <div className="event-card-top">
                    <span className="event-icon">{icon}</span>
                    <div className="event-card-badges">
                      {event.relevanceScore >= 70 && (
                        <span className="relevance-badge high">
                          {event.relevanceScore}% Match
                        </span>
                      )}
                      {event.relevanceScore >= 40 && event.relevanceScore < 70 && (
                        <span className="relevance-badge medium">
                          {event.relevanceScore}% Match
                        </span>
                      )}
                      {event.relevanceScore < 40 && (
                        <span className="relevance-badge low">
                          {event.relevanceScore}% Match
                        </span>
                      )}
                      <span className={`event-countdown ${days <= 2 ? 'soon' : ''}`}>
                        {days === 0
                          ? 'Today!'
                          : days === 1
                            ? 'Tomorrow'
                            : `In ${days} days`}
                      </span>
                    </div>
                  </div>

                  <h3>{event.eventName}</h3>
                  <p className="event-club">{event.category} Event</p>

                  {/* AI Reason */}
                  <div className="ai-reason">
                    <span className="ai-reason-icon">🤖</span>
                    <span>{event.aiReason}</span>
                  </div>

                  <div className="event-date-row">
                    <span className="event-date-label">📅 {dateLabel}</span>
                    <span className="event-time">
                      ⏰{' '}
                      {eventDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="event-full-date">
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>

                  <div className="event-meta-row">
                    <span className="event-location">📍 {event.venue}</span>
                    <span className="event-capacity">
                      👥 {event.registeredMembers}/{event.maxCapacity}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Fallback Events (when no AI events) */}
        {!showAiEvents && !aiLoading && (
          <div className="event-list">
            {fallbackDisplay.map((event) => {
              const matchedSkills = studentSkills.filter((s) =>
                event.requiredSkills.includes(s.toLowerCase())
              )
              return (
                <article className="event-card" key={event.title}>
                  <div className="event-card-top">
                    <span className="event-icon">{event.icon}</span>
                    <span className={`event-countdown ${event.daysAway <= 2 ? 'soon' : ''}`}>
                      {event.daysAway === 0
                        ? 'Today!'
                        : event.daysAway === 1
                          ? 'Tomorrow'
                          : `In ${event.daysAway} days`}
                    </span>
                  </div>

                  <h3>{event.title}</h3>
                  <p className="event-club">{event.club}</p>

                  <div className="event-date-row">
                    <span className="event-date-label">📅 {event.dateLabel}</span>
                    <span className="event-time">⏰ {event.time}</span>
                  </div>

                  <p className="event-full-date">{event.fullDate}</p>

                  {matchedSkills.length > 0 && (
                    <div className="event-matched-skills">
                      {matchedSkills.map((s) => (
                        <span key={s} className="matched-skill-tag">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="community-grid-section">
        <div className="community-section-header">
          <h2>All Communities</h2>
          <p>Find your community and get involved</p>
        </div>
        <div className="community-grid">
          {communities.map((community) => (
            <article
              className="community-card"
              key={community.id}
              onClick={() => navigate(`/communities/${community.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="community-media">
                <img
                  className="community-cover"
                  src={community.cover}
                  alt={`${community.name} cover`}
                />
                <img
                  className="community-logo"
                  src={community.logo}
                  alt={`${community.name} logo`}
                />
              </div>
              <span className="community-tag">{community.tag}</span>
              <h2>{community.name}</h2>
              <p>{community.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Dashboard
