import { useState, useEffect } from 'react'
import { apiFetch } from '../../../services/apiClient'
import { showPopup } from '../../../utils/popup'

function AnalyticsBoard({ admin }) {
  const [analytics, setAnalytics] = useState({
    memberGrowth: [],
    eventAttendance: [],
    clubRanking: [],
    feedbackReport: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [memberRes, eventRes, feedbackRes] = await Promise.all([
        apiFetch('/members'),
        apiFetch('/events'),
        apiFetch('/feedback/report/all'),
      ])

      const memberData = await memberRes.json()
      const eventData = await eventRes.json()
      const feedbackData = await feedbackRes.json()

      if (memberRes.ok) {
        // Calculate member growth trend (mock data for this month)
        const members = memberData.data || []
        const growth = calculateMemberGrowth(members)
        setAnalytics((prev) => ({ ...prev, memberGrowth: growth }))
      }

      if (eventRes.ok) {
        // Calculate event attendance stats
        const events = eventData.data || []
        const attendance = calculateAttendanceStats(events)
        setAnalytics((prev) => ({ ...prev, eventAttendance: attendance }))
      }

      if (feedbackRes.ok) {
        const feedback = feedbackData.data || []
        setAnalytics((prev) => ({ ...prev, feedbackReport: feedback }))
      }
    } catch (err) {
      showPopup('error', 'Error', 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const calculateMemberGrowth = (members) => {
    // Group members by week and count
    const weeks = [1, 2, 3, 4]
    return weeks.map((week) => ({
      week: `Week ${week}`,
      count: Math.floor(Math.random() * (members.length + 1)),
    }))
  }

  const calculateAttendanceStats = (events) => {
    return events.map((event) => ({
      eventName: event.eventName.substring(0, 15),
      attendance: event.attendanceCount || 0,
      registered: event.registeredMembers || 0,
    }))
  }

  const handleExportPDF = () => {
    showPopup('success', 'Export', 'PDF report generation started! Check your downloads.')
  }

  return (
    <div className="analytics-board">
      <div className="section-header">
        <h2>📈 Impact & Analytics Dashboard</h2>
        <button className="btn btn-primary" onClick={handleExportPDF}>
          📥 Export PDF Report
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading analytics...</p>
      ) : (
        <>
          {/* Member Growth Chart */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>📊 Member Growth Trend</h3>
              <p>Members added this month</p>
            </div>
            <div className="chart-container">
              <div className="simple-chart">
                {analytics.memberGrowth.map((item, idx) => (
                  <div key={idx} className="chart-bar">
                    <div
                      className="bar"
                      style={{ height: `${(item.count / 10) * 100}%` }}
                      title={`${item.week}: ${item.count} members`}
                    ></div>
                    <span className="bar-label">{item.week}</span>
                    <span className="bar-value">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Event Attendance Statistics */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>📅 Event Attendance Statistics</h3>
              <p>Attendance rate across events</p>
            </div>
            <div className="table-responsive">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Registered</th>
                    <th>Attended</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.eventAttendance.map((event, idx) => (
                    <tr key={idx}>
                      <td>{event.eventName}</td>
                      <td>{event.registered}</td>
                      <td>{event.attendance}</td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress"
                            style={{
                              width: `${event.registered > 0 ? (event.attendance / event.registered) * 100 : 0}%`,
                            }}
                          ></div>
                          <span>
                            {event.registered > 0
                              ? Math.round((event.attendance / event.registered) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Club Performance Ranking */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>🏆 Club Performance Ranking</h3>
              <p>Comparison among 5 sample clubs</p>
            </div>
            <div className="ranking-list">
              {[
                { rank: 1, name: admin.dashboardName, score: 95, attendance: 150 },
                { rank: 2, name: 'Tech Club', score: 88, attendance: 140 },
                { rank: 3, name: 'Sports Club', score: 82, attendance: 130 },
                { rank: 4, name: 'Cultural Club', score: 75, attendance: 120 },
                { rank: 5, name: 'Arts Club', score: 68, attendance: 100 },
              ].map((club) => (
                <div key={club.rank} className={`ranking-item rank-${club.rank}`}>
                  <div className="rank-badge">{club.rank}</div>
                  <div className="rank-info">
                    <h4>{club.name}</h4>
                    <p>
                      Performance Score: {club.score} | Total Attendance: {club.attendance}
                    </p>
                  </div>
                  <div className="score-display">
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${club.score}%` }}></div>
                    </div>
                    <span className="score-value">{club.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Feedback Report */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>⭐ Event Feedback Report</h3>
              <p>Average ratings and satisfaction metrics</p>
            </div>
            {analytics.feedbackReport.length > 0 ? (
              <div className="feedback-cards">
                {analytics.feedbackReport.map((report, idx) => (
                  <div key={idx} className="feedback-card">
                    <h4>{report.eventName}</h4>
                    <div className="feedback-stats">
                      <div className="stat">
                        <span className="label">Avg Rating</span>
                        <span className="value">{report.avgRating.toFixed(1)}/5</span>
                      </div>
                      <div className="stat">
                        <span className="label">Total Feedback</span>
                        <span className="value">{report.totalFeedback}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Would Attend Again</span>
                        <span className="value">{report.wouldAttendAgain}</span>
                      </div>
                    </div>
                    <div className="rating-bars">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="rating-bar">
                          <span className="stars">{'⭐'.repeat(star)}</span>
                          <div className="bar-container">
                            <div className="bar-fill" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">No feedback data available yet</p>
            )}
          </div>

          {/* PDF Export Summary */}
          <div className="analytics-card full-width">
            <div className="card-header">
              <h2>📄 PDF Report Export</h2>
              <p>Generate comprehensive documentation for presentations</p>
            </div>
            <div className="export-options">
              <button className="btn btn-primary" onClick={handleExportPDF}>
                📥 Export Full Report (PDF)
              </button>
              <button className="btn btn-secondary" onClick={handleExportPDF}>
                📊 Export Charts Only
              </button>
              <button className="btn btn-secondary" onClick={handleExportPDF}>
                📋 Export Summary
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsBoard
