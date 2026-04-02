import { useEffect, useMemo, useState } from 'react'
import './Dashboard.css'
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
    name: 'Cricket Club',
    description: 'Practice sessions, tournaments, and player development for cricket lovers.',
    tag: 'Sports',
    cover: community01,
    logo: logo01,
  },
  {
    name: 'Hockey Club',
    description: 'Build teamwork and fitness through competitive and friendly hockey events.',
    tag: 'Sports',
    cover: community02,
    logo: logo02,
  },
  {
    name: 'Environmental Community',
    description: 'Lead sustainability projects, cleanups, and awareness campaigns on campus.',
    tag: 'Sustainability',
    cover: community03,
    logo: logo03,
  },
  {
    name: 'FOC Event Club',
    description: 'Plan and organize Faculty of Computing events with creative student teams.',
    tag: 'Events',
    cover: community04,
    logo: logo04,
  },
  {
    name: 'Food & Beverages Community',
    description: 'Discover recipes, food culture, and host tasting sessions with friends.',
    tag: 'Lifestyle',
    cover: community05,
    logo: logo05,
  },
]

// day: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
const events = [
  {
    title: 'Campus Cricket Strategy Session',
    club: 'Cricket Club',
    dayOfWeek: 1,          // Monday
    time: '5:30 PM',
    icon: '🏏',
    requiredSkills: ['cricket', 'teamwork', 'leadership'],
  },
  {
    title: 'Hockey Fitness Bootcamp',
    club: 'Hockey Club',
    dayOfWeek: 2,          // Tuesday
    time: '6:00 PM',
    icon: '🏑',
    requiredSkills: ['hockey', 'fitness', 'teamwork'],
  },
  {
    title: 'Green Campus Cleanup Drive',
    club: 'Environmental Community',
    dayOfWeek: 3,          // Wednesday
    time: '4:30 PM',
    icon: '🌿',
    requiredSkills: ['environment', 'sustainability', 'community'],
  },
  {
    title: 'FOC Event Planning Sprint',
    club: 'FOC Event Club',
    dayOfWeek: 4,          // Thursday
    time: '3:00 PM',
    icon: '🎯',
    requiredSkills: ['event', 'coordination', 'design', 'communication'],
  },
  {
    title: 'Campus Food Fest Preparation',
    club: 'Food & Beverages Community',
    dayOfWeek: 5,          // Friday
    time: '2:00 PM',
    icon: '🍜',
    requiredSkills: ['food', 'beverages', 'hospitality', 'marketing'],
  },
]

/** Returns the next real calendar date for a given weekday (0-6) */
function getNextDate(targetDay) {
  const today = new Date()
  const todayDay = today.getDay()
  let daysAhead = targetDay - todayDay
  if (daysAhead <= 0) daysAhead += 7   // always future
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
  const [studentSkills, setStudentSkills] = useState([])
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    const syncSkills = () => {
      const storedStudent = localStorage.getItem('currentStudent')
      if (!storedStudent) {
        setStudentSkills([])
        setStudentName('')
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
      } catch {
        setStudentSkills([])
      }
    }

    syncSkills()
    window.addEventListener('student-profile-updated', syncSkills)
    return () => window.removeEventListener('student-profile-updated', syncSkills)
  }, [])

  // Enrich events with dynamic dates
  const enrichedEvents = useMemo(() =>
    events.map((ev) => {
      const date = getNextDate(ev.dayOfWeek)
      return {
        ...ev,
        nextDate: date,
        dateLabel: formatEventDate(date),
        daysAway: daysUntil(date),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      }
    }), []
  )

  const recommendedEvents = useMemo(() => {
    const normalizedSkills = studentSkills.map((skill) => skill.toLowerCase())
    if (normalizedSkills.length === 0) return []

    return enrichedEvents.filter((event) =>
      event.requiredSkills.some((skill) => normalizedSkills.includes(skill.toLowerCase())),
    )
  }, [studentSkills, enrichedEvents])

  const displayEvents = recommendedEvents.length > 0 ? recommendedEvents : enrichedEvents.slice(0, 3)
  const isPersonalized = recommendedEvents.length > 0

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <p className="dashboard-eyebrow">Student Communities</p>
        <h1>
          {studentName ? `Welcome back, ${studentName} 👋` : 'Welcome to Your Communities'}
        </h1>
        <p>Explore communities and join the clubs that match your passion.</p>
      </section>

      <section className="recommendation-section">
        <div className="recommendation-header">
          <div className="rec-title-row">
            <h2>
              {isPersonalized ? '✨ Recommended Events For You' : 'Upcoming Events'}
            </h2>
            {isPersonalized && (
              <span className="rec-badge">Based on your skills</span>
            )}
          </div>

          {studentSkills.length > 0 ? (
            <div className="skill-list">
              {studentSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          ) : (
            <p className="no-skill-text">
              💡 Add skills in your profile to get personalized event recommendations.
            </p>
          )}
        </div>

        <div className="event-list">
          {displayEvents.map((event) => {
            const matchedSkills = studentSkills.filter((s) =>
              event.requiredSkills.includes(s.toLowerCase())
            )
            return (
              <article className="event-card" key={event.title}>
                <div className="event-card-top">
                  <span className="event-icon">{event.icon}</span>
                  <span className={`event-countdown ${event.daysAway <= 2 ? 'soon' : ''}`}>
                    {event.daysAway === 0 ? 'Today!' : event.daysAway === 1 ? 'Tomorrow' : `In ${event.daysAway} days`}
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
                      <span key={s} className="matched-skill-tag">✓ {s}</span>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="community-grid-section">
        <div className="community-section-header">
          <h2>All Communities</h2>
          <p>Find your community and get involved</p>
        </div>
        <div className="community-grid">
          {communities.map((community) => (
            <article className="community-card" key={community.name}>
              <div className="community-media">
                <img className="community-cover" src={community.cover} alt={`${community.name} cover`} />
                <img className="community-logo" src={community.logo} alt={`${community.name} logo`} />
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
