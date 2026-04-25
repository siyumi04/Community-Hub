import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import Event from '../models/Event.js'
import Notice from '../models/Notice.js'
import Member from '../models/Member.js'
import Feedback from '../models/Feedback.js'

const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled']
const NOTICE_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value))

const getLastSixMonths = () => {
  const now = new Date()
  const months = []

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      key,
      label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      eventsCreated: 0,
      noticesCreated: 0,
      membersApproved: 0,
    })
  }

  return months
}

const monthKey = (dateValue) => {
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const buildMailTransporter = () => {
  const host = process.env.SMTP_HOST
  const port = Number.parseInt(String(process.env.SMTP_PORT || 587), 10)
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass || Number.isNaN(port)) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

export const getAnalyticsSummary = async (req, res) => {
  try {
    const adminId = req.auth?.adminId
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization is required',
      })
    }

    const adminObjectId = toObjectId(adminId)

    const [events, notices, members, feedback] = await Promise.all([
      Event.find({ adminId: adminObjectId }).lean(),
      Notice.find({ adminId: adminObjectId }).lean(),
      Member.find({ adminId: adminObjectId }).lean(),
      Feedback.find({ adminId: adminObjectId }).lean(),
    ])

    const approvedMembers = members.filter((member) => member.status === 'approved')

    const eventsByStatus = EVENT_STATUSES.map((status) => ({
      status,
      count: events.filter((event) => event.eventStatus === status).length,
    }))

    const noticesByPriority = NOTICE_PRIORITIES.map((priority) => ({
      priority,
      count: notices.filter((notice) => notice.priority === priority).length,
    }))

    const totalRegistered = events.reduce((sum, event) => sum + (event.registeredMembers || 0), 0)
    const totalAttendance = events.reduce((sum, event) => sum + (event.attendanceCount || 0), 0)
    const overallAttendanceRate = totalRegistered > 0
      ? Number(((totalAttendance / totalRegistered) * 100).toFixed(1))
      : 0

    const totalNoticesViews = notices.reduce((sum, notice) => sum + (notice.views || 0), 0)
    const activeNotices = notices.filter((notice) => notice.isActive).length

    const feedbackByEvent = feedback.reduce((acc, entry) => {
      const key = String(entry.eventId)
      if (!acc[key]) {
        acc[key] = {
          totalRating: 0,
          totalResponses: 0,
          wouldAttendAgain: 0,
        }
      }

      acc[key].totalRating += Number(entry.rating || 0)
      acc[key].totalResponses += 1
      if (entry.wouldAttendAgain) acc[key].wouldAttendAgain += 1
      return acc
    }, {})

    const monthlyTrend = getLastSixMonths()
    const monthLookup = Object.fromEntries(monthlyTrend.map((month) => [month.key, month]))

    events.forEach((event) => {
      const key = monthKey(event.createdAt)
      if (monthLookup[key]) monthLookup[key].eventsCreated += 1
    })

    notices.forEach((notice) => {
      const key = monthKey(notice.createdAt)
      if (monthLookup[key]) monthLookup[key].noticesCreated += 1
    })

    approvedMembers.forEach((member) => {
      const sourceDate = member.approvedDate || member.joinedDate || member.createdAt
      const key = monthKey(sourceDate)
      if (monthLookup[key]) monthLookup[key].membersApproved += 1
    })

    const eventPerformance = events
      .map((event) => {
        const registered = Number(event.registeredMembers || 0)
        const attendance = Number(event.attendanceCount || 0)
        const feedbackStats = feedbackByEvent[String(event._id)]
        const feedbackCount = feedbackStats?.totalResponses || 0
        const feedbackAvgRating = feedbackCount > 0
          ? Number((feedbackStats.totalRating / feedbackCount).toFixed(2))
          : 0

        return {
          _id: event._id,
          eventName: event.eventName,
          eventStatus: event.eventStatus,
          startDate: event.startDate,
          venue: event.venue || event.location,
          registered,
          attendance,
          attendanceRate: registered > 0 ? Number(((attendance / registered) * 100).toFixed(1)) : 0,
          feedbackCount,
          feedbackAvgRating,
        }
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate)

    const noticePerformance = notices
      .map((notice) => ({
        _id: notice._id,
        title: notice.title,
        priority: notice.priority,
        views: Number(notice.views || 0),
        isActive: Boolean(notice.isActive),
        createdAt: notice.createdAt,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)

    const totalFeedbackResponses = feedback.length
    const totalFeedbackRating = feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0)
    const totalWouldAttendAgain = feedback.reduce((sum, item) => sum + (item.wouldAttendAgain ? 1 : 0), 0)

    const avgFeedbackRating = totalFeedbackResponses > 0
      ? Number((totalFeedbackRating / totalFeedbackResponses).toFixed(2))
      : 0
    const wouldAttendAgainRate = totalFeedbackResponses > 0
      ? Number(((totalWouldAttendAgain / totalFeedbackResponses) * 100).toFixed(1))
      : 0

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalMembers: members.length,
          approvedMembers: approvedMembers.length,
          totalEvents: events.length,
          upcomingEvents: eventsByStatus.find((item) => item.status === 'upcoming')?.count || 0,
          totalNotices: notices.length,
          activeNotices,
          totalNoticeViews: totalNoticesViews,
          totalFeedbackResponses,
          avgFeedbackRating,
          overallAttendanceRate,
        },
        eventsByStatus,
        noticesByPriority,
        monthlyTrend,
        eventPerformance,
        noticePerformance,
        feedbackSummary: {
          totalResponses: totalFeedbackResponses,
          avgRating: avgFeedbackRating,
          wouldAttendAgainRate,
        },
      },
      message: 'Analytics summary retrieved successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve analytics summary',
    })
  }
}

export const emailAnalyticsReport = async (req, res) => {
  try {
    const adminEmail = req.auth?.email
    const { to, subject, message, reportBase64, reportName } = req.body || {}

    if (!to || !subject || !reportBase64) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and report file are required',
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(to).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid recipient email address',
      })
    }

    const transporter = buildMailTransporter()
    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and optional SMTP_FROM in backend .env.',
      })
    }

    const cleanedBase64 = String(reportBase64)
      .replace(/^data:application\/pdf;base64,/, '')
      .trim()

    let reportBuffer
    try {
      reportBuffer = Buffer.from(cleanedBase64, 'base64')
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid report file format',
      })
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER

    await transporter.sendMail({
      from: fromAddress,
      to: String(to).trim(),
      subject: String(subject).trim(),
      text: `${message || 'Please find the attached analytics report.'}\n\nSent by: ${adminEmail || 'Community Hub Admin'}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
          <p>${String(message || 'Please find the attached analytics report.').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <p style="margin-top: 16px;"><strong>Sent by:</strong> ${String(adminEmail || 'Community Hub Admin')}</p>
          <p style="color: #64748b; font-size: 12px;">This message was sent from Community Hub Analytics.</p>
        </div>
      `,
      attachments: [
        {
          filename: `${String(reportName || 'analytics-report')}.pdf`,
          content: reportBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    return res.status(200).json({
      success: true,
      message: 'Analytics report emailed successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send analytics report email',
    })
  }
}