import { useState, useEffect } from 'react'
import { apiFetch } from '../../../services/apiClient'
import MiniCalendar from '../components/MiniCalendar'

function DashboardOverview({ admin, memberStats, eventStats, noticeRefreshSignal }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotices()
  }, [noticeRefreshSignal])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/notices/active')
      const data = await response.json()
      if (response.ok && data.success) {
        setNotices(data.data.slice(0, 3))
      }
    } catch (err) {
      console.error('Failed to fetch notices:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-overview">
      {/* Welcome summary strip */}
      <div className="overview-welcome">
        <div>
          <p className="overview-greeting">Welcome back, {admin?.firstName}!</p>
          <p className="overview-sub">Here&apos;s what&apos;s happening in your community hub today.</p>
        </div>
        <div className="overview-meta">
          <span className="overview-chip">Dashboard: {admin?.dashboardName}</span>
          <span className="overview-chip">Admin ID: {admin?.itNumber}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Members</h3>
            <p className="stat-number">{memberStats?.total || 0}</p>
            <p className="stat-detail">{memberStats?.approved || 0} approved</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Upcoming Events</h3>
            <p className="stat-number">{eventStats?.upcoming || 0}</p>
            <p className="stat-detail">Next: Check events tab</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Pending Requests</h3>
            <p className="stat-number">{memberStats?.pending || 0}</p>
            <p className="stat-detail">Action required</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📢</div>
          <div className="stat-content">
            <h3>Active Notices</h3>
            <p className="stat-number">{notices.length}</p>
            <p className="stat-detail">Posted to members</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="overview-grid">
        {/* Mini Calendar */}
        <div className="overview-card">
          <div className="card-header">
            <h2>📅 Calendar</h2>
            <p>This month's events</p>
          </div>
          <MiniCalendar />
        </div>

        {/* Recent Notices */}
        <div className="overview-card">
          <div className="card-header">
            <h2>📢 Recent Notices</h2>
            <p>Latest announcements</p>
          </div>
          {loading ? (
            <p className="loading">Loading notices...</p>
          ) : notices.length > 0 ? (
            <div className="notices-list">
              {notices.map((notice) => (
                <div key={notice._id} className="notice-item">
                  <div className={`notice-priority ${notice.priority.toLowerCase()}`}>
                    {notice.priority}
                  </div>
                  <div className="notice-content">
                    <h4>{notice.title}</h4>
                    <p>{notice.content.substring(0, 100)}...</p>
                    <span className="notice-date">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No active notices</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="overview-card full-width">
        <div className="card-header">
          <h2>⚡ Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <button className="action-btn primary">
            ➕ Create Event
          </button>
          <button className="action-btn secondary">
            👤 Approve Member
          </button>
          <button className="action-btn secondary">
            📢 Post Notice
          </button>
          <button className="action-btn secondary">
            📊 View Analytics
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview
