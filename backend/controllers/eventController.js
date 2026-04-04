import Event from '../models/Event.js'
import mongoose from 'mongoose'

// Create new event
export const createEvent = async (req, res) => {
  try {
    const { eventName, description, category, startDate, endDate, location, maxCapacity } = req.body
    const adminId = req.admin?.id || req.admin?._id

    if (!eventName || !description || !startDate || !endDate || !location || !maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      })
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      })
    }

    const event = new Event({
      adminId,
      eventName,
      description,
      category: category || 'Other',
      startDate,
      endDate,
      location,
      maxCapacity,
      eventStatus: new Date(startDate) > new Date() ? 'upcoming' : 'ongoing',
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
    const adminId = req.admin?.id || req.admin?._id
    const { status } = req.query // 'upcoming', 'completed', etc.

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
    const adminId = req.admin?.id || req.admin?._id

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
    const adminId = req.admin?.id || req.admin?._id
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
    const adminId = req.admin?.id || req.admin?._id

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
    const adminId = req.admin?.id || req.admin?._id

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
    const adminId = req.admin?.id || req.admin?._id

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
