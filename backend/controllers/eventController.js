import Event from '../models/Event.js'
import mongoose from 'mongoose'
import Groq from 'groq-sdk'

let groqClient
const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

const toInt = (value) => Number.parseInt(String(value), 10)

const validateYearMonth = (year, month) => {
  const normalizedYear = toInt(year)
  const normalizedMonth = toInt(month)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (!Number.isInteger(normalizedYear) || normalizedYear < currentYear || normalizedYear > currentYear + 5) {
    return { valid: false, message: 'Year must be between current year and next 5 years' }
  }

  if (!Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12) {
    return { valid: false, message: 'Month must be between 1 and 12' }
  }

  if (normalizedYear === currentYear && normalizedMonth < currentMonth) {
    return { valid: false, message: 'For the current year, month must be current or future' }
  }

  return { valid: true, normalizedYear, normalizedMonth }
}

const normalizeSuggestedDate = (dateCandidate, year, month) => {
  const now = new Date()
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  let normalized = dateCandidate
  if (!(normalized instanceof Date) || Number.isNaN(normalized.getTime())) {
    normalized = findSecondSaturday(year, month)
  }

  if (normalized < monthStart || normalized > monthEnd) {
    normalized = findSecondSaturday(year, month)
  }

  if (normalized <= now) {
    const nextDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 9, 0, 0))
    if (nextDay >= monthStart && nextDay <= monthEnd) {
      normalized = nextDay
    }
  }

  if (normalized <= now) {
    return null
  }

  return normalized
}

const findSecondSaturday = (year, month) => {
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 9, 0, 0))
  const firstWeekday = firstDay.getUTCDay()
  const firstSaturdayDate = ((6 - firstWeekday + 7) % 7) + 1
  const secondSaturdayDate = firstSaturdayDate + 7
  return new Date(Date.UTC(year, month - 1, secondSaturdayDate, 9, 0, 0))
}

const buildFallbackPost = ({ eventName, venue, year, month, startDate }) => {
  const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  const dateLabel = startDate.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return {
    eventPost: `${eventName} is scheduled for ${dateLabel} at ${venue}. This date was selected to maximize student availability in ${monthName} ${year}. Join us for an engaging and well-planned community event.`,
    suggestedDate: startDate,
  }
}

const analyzeEventPlan = async ({ eventName, venue, year, month }) => {
  const fallbackDate = findSecondSaturday(year, month)
  const fallback = buildFallbackPost({ eventName, venue, year, month, startDate: fallbackDate })

  if (!process.env.GROQ_API_KEY) {
    return fallback
  }

  try {
    const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
    const prompt = `You are an event planning assistant.\nGiven this event info:\n- Event: ${eventName}\n- Venue: ${venue}\n- Year: ${year}\n- Month: ${monthName}\nChoose ONE suitable date in this month (YYYY-MM-DD) that is realistic for student attendance, and generate a concise post (max 70 words).\nReturn ONLY valid JSON: {\"date\":\"YYYY-MM-DD\",\"post\":\"...\"}`

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = completion.choices?.[0]?.message?.content
    if (!raw) return fallback

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!parsed?.date || !parsed?.post) return fallback

    const suggestedDate = normalizeSuggestedDate(new Date(`${parsed.date}T09:00:00.000Z`), year, month)
    if (!suggestedDate) return fallback

    return {
      suggestedDate,
      eventPost: String(parsed.post).trim(),
    }
  } catch {
    return fallback
  }
}

// Create new event
export const createEvent = async (req, res) => {
  try {
    const { eventName, venue, year, month } = req.body
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization is required',
      })
    }

    if (!eventName || !venue || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Event name, venue, year, and month are required',
      })
    }

    const validated = validateYearMonth(year, month)
    if (!validated.valid) {
      return res.status(400).json({
        success: false,
        message: validated.message,
      })
    }

    const normalizedEventName = String(eventName).trim()
    const normalizedVenue = String(venue).trim()
    const { normalizedYear, normalizedMonth } = validated
    let { suggestedDate, eventPost } = await analyzeEventPlan({
      eventName: normalizedEventName,
      venue: normalizedVenue,
      year: normalizedYear,
      month: normalizedMonth,
    })

    suggestedDate = normalizeSuggestedDate(suggestedDate, normalizedYear, normalizedMonth)
    if (!suggestedDate) {
      return res.status(400).json({
        success: false,
        message: 'Selected month has no remaining future dates. Please choose a future month.',
      })
    }

    const startDate = suggestedDate
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

    const event = new Event({
      adminId,
      eventName: normalizedEventName,
      description: eventPost,
      category: 'Other',
      startDate,
      endDate,
      location: normalizedVenue,
      maxCapacity: 150,
      venue: normalizedVenue,
      year: normalizedYear,
      month: normalizedMonth,
      eventPost,
      suggestedDate: startDate,
      eventStatus: 'upcoming',
    })

    await event.save()
    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create event',
    })
  }
}

// Get all events for admin
export const getEvents = async (req, res) => {
  try {
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id
    const { status } = req.query // 'upcoming', 'completed', etc.

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization is required',
      })
    }

    let filter = { adminId }
    if (status) filter.eventStatus = status

    const events = await Event.find(filter).sort({ startDate: -1 })
    res.status(200).json({
      success: true,
      data: events,
      message: 'Events retrieved successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch events',
    })
  }
}

// Get single event details
export const getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id

    const event = await Event.findOne({ _id: eventId, adminId })
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    res.status(200).json({
      success: true,
      data: event,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch event details',
    })
  }
}

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id
    const updates = req.body

    const event = await Event.findOneAndUpdate({ _id: eventId, adminId }, updates, { new: true })

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    res.status(200).json({
      success: true,
      data: event,
      message: 'Event updated successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update event',
    })
  }
}

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id

    const event = await Event.findOneAndDelete({ _id: eventId, adminId })

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    res.status(200).json({
      success: true,
      data: event,
      message: 'Event deleted successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete event',
    })
  }
}

// Mark attendance for member at event
export const markAttendance = async (req, res) => {
  try {
    const { eventId, memberId } = req.params
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id

    const event = await Event.findOne({ _id: eventId, adminId })
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    const registeredIndex = event.registeredList.findIndex((r) => r.memberId?.toString() === memberId)
    if (registeredIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not registered for this event',
      })
    }

    event.registeredList[registeredIndex].attended = true
    event.attendanceCount += 1
    await event.save()

    res.status(200).json({
      success: true,
      data: event,
      message: 'Attendance marked successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to mark attendance',
    })
  }
}

// Get event statistics
export const getEventStats = async (req, res) => {
  try {
    const adminId = req.auth?.adminId || req.admin?.id || req.admin?._id

    const stats = await Event.aggregate([
      { $match: { adminId: new mongoose.Types.ObjectId(adminId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upcoming: { $sum: { $cond: [{ $eq: ['$eventStatus', 'upcoming'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$eventStatus', 'completed'] }, 1, 0] } },
          totalAttendance: { $sum: '$attendanceCount' },
        },
      },
    ])

    res.status(200).json({
      success: true,
      data: stats[0] || { total: 0, upcoming: 0, completed: 0, totalAttendance: 0 },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch event stats',
    })
  }
}
