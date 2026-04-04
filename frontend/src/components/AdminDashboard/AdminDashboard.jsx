import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './AdminDashboard.css'
import { apiFetch } from '../../services/apiClient'
import DashboardOverview from './sections/DashboardOverview'
import MemberManagement from './sections/MemberManagement'
import EventManagement from './sections/EventManagement'
import NoticeManagement from './sections/NoticeManagement'
import AnalyticsBoard from './sections/AnalyticsBoard'

function AdminDashboard() {
  const { dashboardName } = useParams()
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [memberStats, setMemberStats] = useState(null)
  const [eventStats, setEventStats] = useState(null)

  useEffect(() => {
    const storedAdmin = localStorage.getItem('currentAdmin')
    if (!storedAdmin) {
      navigate('/login')
      return
    }

    try {
      const adminData = JSON.parse(storedAdmin)
      if (adminData.dashboardName !== dashboardName) {
        navigate('/login')
        return
      }
      setAdmin(adminData)
      fetchStats()
    } catch (err) {
      navigate('/login')
    }
  }, [dashboardName, navigate])

  const fetchStats = async () => {
    try {
      const [memberRes, eventRes] = await Promise.all([
        apiFetch('/members/stats'),
        apiFetch('/events/stats'),
      ])

      const memberData = await memberRes.json()
      const eventData = await eventRes.json()

      if (memberRes.ok && memberData.success) {
        setMemberStats(memberData.data)
      }
      if (eventRes.ok && eventData.success) {
        setEventStats(eventData.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentAdmin')
    localStorage.removeItem('authToken')
    window.dispatchEvent(new Event('logout'))
    navigate('/login')
  }

  if (!admin) {
    return <div className="admin-dashboard loading">Loading...</div>
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-header">
          <h2>🎯 Club Dashboard</h2>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>📊 Overview</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <span>👥 Members</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <span>📅 Events</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'notices' ? 'active' : ''}`}
            onClick={() => setActiveTab('notices')}
          >
            <span>📢 Notices</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span>📈 Analytics</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">
              {admin.firstName.charAt(0).toUpperCase()}
            </div>
            <div className="admin-details">
              <p className="admin-name">{admin.firstName} {admin.lastName}</p>
              <p className="admin-club">{admin.dashboardName}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <h1>{admin.dashboardName}</h1>
          <p>Welcome back, {admin.firstName}!</p>
        </header>

        <div className="admin-content">
          {activeTab === 'overview' && (
            <DashboardOverview admin={admin} memberStats={memberStats} eventStats={eventStats} />
          )}
          {activeTab === 'members' && <MemberManagement admin={admin} />}
          {activeTab === 'events' && <EventManagement admin={admin} />}
          {activeTab === 'notices' && <NoticeManagement admin={admin} />}
          {activeTab === 'analytics' && <AnalyticsBoard admin={admin} />}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
