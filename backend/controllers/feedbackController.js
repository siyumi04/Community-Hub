import Feedback from '../models/Feedback.js'
import Event from '../models/Event.js'
import mongoose from 'mongoose'

// Submit feedback for an event
export const submitFeedback = async (req, res) => {
  try {
    const { eventId, memberId, memberName, rating, comment, wouldAttendAgain, suggestions } = req.body
    const adminId = req.admin?.id || req.admin?._id

    if (!eventId || !memberId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Event ID, member ID, and rating are required',
      })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      })
    }

    const feedback = new Feedback({
      eventId,
      adminId,
      memberId,
      memberName,
      rating,
      comment,
      wouldAttendAgain,
      suggestions,
    })

    await feedback.save()

    // Mark event as feedback collected if this is the first feedback
    await Event.findByIdAndUpdate(eventId, { feedbackCollected: true })

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit feedback',
    })
  }
}

// Get all feedback for an event
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params
    const adminId = req.admin?.id || req.admin?._id

    const feedback = await Feedback.find({ eventId, adminId }).sort({ submittedAt: -1 })

    res.status(200).json({
      success: true,
      data: feedback,
      message: 'Feedback retrieved successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch feedback',
    })
  }
}

// Get all feedback for an admin
export const getAllFeedback = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.admin?._id
    const feedback = await Feedback.find({ adminId }).sort({ submittedAt: -1 })

    res.status(200).json({
      success: true,
      data: feedback,
      message: 'All feedback retrieved successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch feedback',
    })
  }
}

// Get feedback statistics for an event
export const getEventFeedbackStats = async (req, res) => {
  try {
    const { eventId } = req.params
    const adminId = req.admin?.id || req.admin?._id

    const stats = await Feedback.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId), adminId: new mongoose.Types.ObjectId(adminId) } },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          wouldAttendAgainCount: { $sum: { $cond: ['$wouldAttendAgain', 1, 0] } },
          ratingDistribution: {
            $push: '$rating',
          },
        },
      },
    ])

    const data = stats[0] || {
      totalFeedback: 0,
      avgRating: 0,
      wouldAttendAgainCount: 0,
      ratingDistribution: [],
    }

    // Calculate rating breakdown
    const ratingBreakdown = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    data.ratingDistribution.forEach((rating) => {
      ratingBreakdown[rating]++
    })

    delete data.ratingDistribution

    res.status(200).json({
      success: true,
      data: {
        ...data,
        ratingBreakdown,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch feedback stats',
    })
  }
}

// Get feedback report for all events
export const getFeedbackReport = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.admin?._id

    const report = await Feedback.aggregate([
      { $match: { adminId: new mongoose.Types.ObjectId(adminId) } },
      {
        $group: {
          _id: '$eventId',
          totalFeedback: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          wouldAttendAgain: { $sum: { $cond: ['$wouldAttendAgain', 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: '$event',
      },
      {
        $project: {
          _id: 0,
          eventId: '$_id',
          eventName: '$event.eventName',
          totalFeedback: 1,
          avgRating: 1,
          wouldAttendAgain: 1,
        },
      },
      { $sort: { avgRating: -1 } },
    ])

    res.status(200).json({
      success: true,
      data: report,
      message: 'Feedback report retrieved successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch feedback report',
    })
  }
}
