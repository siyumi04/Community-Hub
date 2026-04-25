import { useMemo, useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { apiFetch } from '../../../services/apiClient'
import { showPopup } from '../../../utils/popup'

function AnalyticsBoard({ admin }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('Community Hub Analytics Report')
  const [emailMessage, setEmailMessage] = useState('Hello,\n\nPlease find the attached analytics report generated from Community Hub Admin Dashboard.')
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const summaryRes = await apiFetch('/analytics/summary')
      const summaryData = await summaryRes.json()

      if (!summaryRes.ok || !summaryData.success) {
        throw new Error(summaryData.message || 'Failed to load analytics summary')
      }

      setAnalytics(summaryData.data)
    } catch (err) {
      showPopup('error', 'Error', err.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (value) => {
    if (!value) return 'N/A'
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const buildReportDoc = () => {
    if (!analytics) return null

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    doc.setFontSize(18)
    doc.text('Community Hub - Analytics Report', 40, 48)

    doc.setFontSize(11)
    doc.text(`Dashboard: ${admin?.dashboardName || 'Admin Dashboard'}`, 40, 70)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 86)

    const overview = analytics.overview || {}
    autoTable(doc, {
      startY: 108,
      head: [['KPI', 'Value']],
      body: [
        ['Total Members', String(overview.totalMembers || 0)],
        ['Approved Members', String(overview.approvedMembers || 0)],
        ['Total Events', String(overview.totalEvents || 0)],
        ['Upcoming Events', String(overview.upcomingEvents || 0)],
        ['Total Notices', String(overview.totalNotices || 0)],
        ['Active Notices', String(overview.activeNotices || 0)],
        ['Total Notice Views', String(overview.totalNoticeViews || 0)],
        ['Average Feedback Rating', `${overview.avgFeedbackRating || 0}/5`],
        ['Overall Attendance Rate', `${overview.overallAttendanceRate || 0}%`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] },
    })

    const events = (analytics.eventPerformance || []).slice(0, 8)
    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 108) + 16,
      head: [['Event', 'Status', 'Registered', 'Attended', 'Attendance %', 'Avg Rating']],
      body: events.map((event) => [
        event.eventName,
        event.eventStatus,
        String(event.registered || 0),
        String(event.attendance || 0),
        `${event.attendanceRate || 0}%`,
        `${event.feedbackAvgRating || 0}/5`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    })

    const notices = (analytics.noticePerformance || []).slice(0, 8)
    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 108) + 16,
      head: [['Notice Title', 'Priority', 'Views', 'Status', 'Created']],
      body: notices.map((notice) => [
        notice.title,
        notice.priority,
        String(notice.views || 0),
        notice.isActive ? 'Active' : 'Archived',
        formatDateTime(notice.createdAt),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 118, 110] },
    })

    return doc
  }

  const handleExportPDF = () => {
    const doc = buildReportDoc()
    if (!doc) {
      showPopup('warning', 'No Data', 'Analytics is still loading. Please try again.')
      return
    }

    const stamp = new Date().toISOString().slice(0, 10)
    doc.save(`${admin?.dashboardName || 'club'}-analytics-${stamp}.pdf`)
    showPopup('success', 'Exported', 'Analytics report downloaded successfully.')
  }

  const handleEmailReport = async (e) => {
    e.preventDefault()

    if (!emailTo.trim()) {
      showPopup('error', 'Validation', 'Recipient email is required')
      return
    }

    const doc = buildReportDoc()
    if (!doc) {
      showPopup('warning', 'No Data', 'Analytics is still loading. Please try again.')
      return
    }

    try {
      setSendingEmail(true)
      const reportBase64 = doc.output('datauristring')
      const response = await apiFetch('/analytics/reports/email', {
        method: 'POST',
        body: JSON.stringify({
          to: emailTo.trim(),
          subject: emailSubject.trim() || 'Community Hub Analytics Report',
          message: emailMessage.trim(),
          reportName: `${admin?.dashboardName || 'club'}-analytics-report`,
          reportBase64,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to send report email')
      }

      showPopup('success', 'Email Sent', 'Analytics report has been emailed successfully.')
      setEmailTo('')
    } catch (err) {
      showPopup('error', 'Email Failed', err.message || 'Failed to send analytics report email')
    } finally {
      setSendingEmail(false)
    }
  }

  const eventStatusChartStyle = useMemo(() => {
    const statuses = analytics?.eventsByStatus || []
    const total = statuses.reduce((sum, item) => sum + Number(item.count || 0), 0)
    if (total === 0) {
      return { background: 'conic-gradient(#334155 0 100%)' }
    }

    const palette = {
      upcoming: '#38bdf8',
      ongoing: '#f59e0b',
      completed: '#22c55e',
      cancelled: '#ef4444',
    }

    let current = 0
    const stops = statuses.map((item) => {
      const slice = (Number(item.count || 0) / total) * 100
      const from = current
      const to = current + slice
      current = to
      return `${palette[item.status] || '#64748b'} ${from.toFixed(2)}% ${to.toFixed(2)}%`
    })

    return {
      background: `conic-gradient(${stops.join(', ')})`,
    }
  }, [analytics])

  return (
    <div className="analytics-board">
      <div className="section-header">
        <h2>📈 Impact Analytics Dashboard</h2>
        <button className="btn btn-primary" onClick={handleExportPDF}>
          📥 Export PDF Report
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading analytics...</p>
      ) : !analytics ? (
        <p className="empty">Analytics data is unavailable right now.</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Total Members</h3>
                <p className="stat-number">{analytics.overview.totalMembers}</p>
                <p className="stat-detail">Approved: {analytics.overview.approvedMembers}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>Total Events</h3>
                <p className="stat-number">{analytics.overview.totalEvents}</p>
                <p className="stat-detail">Upcoming: {analytics.overview.upcomingEvents}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📢</div>
              <div className="stat-content">
                <h3>Notice Views</h3>
                <p className="stat-number">{analytics.overview.totalNoticeViews}</p>
                <p className="stat-detail">Active Notices: {analytics.overview.activeNotices}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3>Avg Feedback</h3>
                <p className="stat-number">{analytics.overview.avgFeedbackRating}/5</p>
                <p className="stat-detail">Attendance: {analytics.overview.overallAttendanceRate}%</p>
              </div>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="card-header">
                <h3>📊 Monthly Activity Trend</h3>
                <p>Events, notices, and approved members in the last 6 months</p>
              </div>
              <div className="chart-container">
                <div className="simple-chart analytics-trend-chart">
                  {analytics.monthlyTrend.map((month) => {
                    const max = Math.max(...analytics.monthlyTrend.map((item) => item.eventsCreated + item.noticesCreated + item.membersApproved), 1)
                    const total = month.eventsCreated + month.noticesCreated + month.membersApproved
                    const height = Math.max((total / max) * 100, total > 0 ? 12 : 4)
                    return (
                      <div key={month.key} className="chart-bar">
                        <div
                          className="bar"
                          style={{ height: `${height}%` }}
                          title={`${month.label}: Events ${month.eventsCreated}, Notices ${month.noticesCreated}, Members ${month.membersApproved}`}
                        ></div>
                        <span className="bar-label">{month.label}</span>
                        <span className="bar-value">{total}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-header">
                <h3>🧭 Event Status Breakdown</h3>
                <p>Current distribution of event lifecycle states</p>
              </div>
              <div className="status-donut-wrap">
                <div className="status-donut" style={eventStatusChartStyle}></div>
                <div className="status-legend">
                  {analytics.eventsByStatus.map((status) => (
                    <div key={status.status} className={`status-legend-item status-${status.status}`}>
                      <span className="legend-dot"></span>
                      <span className="legend-label">{status.status}</span>
                      <strong>{status.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>📅 Event Performance Table</h3>
              <p>Attendance and feedback quality for your created events</p>
            </div>
            <div className="table-responsive">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Attended</th>
                    <th>Attendance Rate</th>
                    <th>Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.eventPerformance.length > 0 ? analytics.eventPerformance.map((event) => (
                    <tr key={event._id}>
                      <td>
                        <strong>{event.eventName}</strong>
                        <div className="table-subtext">{formatDateTime(event.startDate)} • {event.venue || 'Venue TBD'}</div>
                      </td>
                      <td><span className={`badge badge-${event.eventStatus}`}>{event.eventStatus}</span></td>
                      <td>{event.registered}</td>
                      <td>{event.attendance}</td>
                      <td>{event.attendanceRate}%</td>
                      <td>{event.feedbackAvgRating}/5 ({event.feedbackCount})</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="empty">No events available yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>📢 Notice Engagement Table</h3>
              <p>Most viewed notices from this dashboard</p>
            </div>
            <div className="table-responsive">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Views</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.noticePerformance.length > 0 ? analytics.noticePerformance.map((notice) => (
                    <tr key={notice._id}>
                      <td>{notice.title}</td>
                      <td>{notice.priority}</td>
                      <td>{notice.views}</td>
                      <td>{notice.isActive ? 'Active' : 'Archived'}</td>
                      <td>{formatDateTime(notice.createdAt)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="empty">No notices available yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="analytics-card report-actions-card">
            <div className="card-header">
              <h3>📄 Report Center</h3>
              <p>Download a detailed PDF report or send it directly by email</p>
            </div>
            <div className="export-options">
              <button className="btn btn-primary" onClick={handleExportPDF}>
                📥 Download Full PDF Report
              </button>
            </div>

            <form className="email-report-form" onSubmit={handleEmailReport}>
              <div className="form-row">
                <input
                  type="email"
                  placeholder="Recipient email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                />
              </div>
              <textarea
                rows={4}
                placeholder="Email message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
              <button className="btn btn-secondary" type="submit" disabled={sendingEmail}>
                {sendingEmail ? 'Sending report...' : '✉️ Email PDF Report'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsBoard
