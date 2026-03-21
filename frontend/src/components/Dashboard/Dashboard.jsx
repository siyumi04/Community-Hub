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

const events = [
  {
    title: 'Campus Cricket Strategy Session',
    club: 'Cricket Club',
    date: 'Monday 5:30 PM',
    requiredSkills: ['cricket', 'teamwork', 'leadership'],
  },
  {
    title: 'Hockey Fitness Bootcamp',
    club: 'Hockey Club',
    date: 'Tuesday 6:00 PM',
    requiredSkills: ['hockey', 'fitness', 'teamwork'],
  },
  {
    title: 'Green Campus Cleanup Drive',
    club: 'Environmental Community',
    date: 'Wednesday 4:30 PM',
    requiredSkills: ['environment', 'sustainability', 'community'],
  },
  {
    title: 'FOC Event Planning Sprint',
    club: 'FOC Event Club',
    date: 'Thursday 3:00 PM',
    requiredSkills: ['event', 'coordination', 'design', 'communication'],
  },
  {
    title: 'Campus Food Fest Preparation',
    club: 'Food & Beverages Community',
    date: 'Friday 2:00 PM',
    requiredSkills: ['food', 'beverages', 'hospitality', 'marketing'],
  },
]

function Dashboard() {
  const [studentSkills, setStudentSkills] = useState([])

  useEffect(() => {
    const syncSkills = () => {
      const storedStudent = localStorage.getItem('currentStudent')
      if (!storedStudent) {
        setStudentSkills([])
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
      } catch {
        setStudentSkills([])
      }
    }

    syncSkills()
    window.addEventListener('student-profile-updated', syncSkills)
    return () => window.removeEventListener('student-profile-updated', syncSkills)
  }, [])

  const recommendedEvents = useMemo(() => {
    const normalizedSkills = studentSkills.map((skill) => skill.toLowerCase())
    if (normalizedSkills.length === 0) return []

    return events.filter((event) =>
      event.requiredSkills.some((skill) => normalizedSkills.includes(skill.toLowerCase())),
    )
  }, [studentSkills])

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <p className="dashboard-eyebrow">Student Communities</p>
        <h1>Welcome to Your Communities</h1>
        <p>
          Explore communities and join the clubs that match your passion.
        </p>
      </section>

      <section className="recommendation-section">
        <div className="recommendation-header">
          <h2>Recommended Events For You</h2>
          {studentSkills.length > 0 ? (
            <div className="skill-list">
              {studentSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          ) : (
            <p className="no-skill-text">Add skills in your profile to get better event recommendations.</p>
          )}
        </div>

        <div className="event-list">
          {(recommendedEvents.length > 0 ? recommendedEvents : events.slice(0, 3)).map((event) => (
            <article className="event-card" key={event.title}>
              <h3>{event.title}</h3>
              <p>{event.club}</p>
              <span>{event.date}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="community-grid-section">
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
              <button type="button" className="join-btn">Join Community</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Dashboard
