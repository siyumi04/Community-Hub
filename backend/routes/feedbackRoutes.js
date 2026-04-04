import express from 'express'
import {
  submitFeedback,
  getEventFeedback,
  getAllFeedback,
  getEventFeedbackStats,
  getFeedbackReport,
} from '../controllers/feedbackController.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(verifyAdminToken)

// Get routes
router.get('/', getAllFeedback)
router.get('/event/:eventId', getEventFeedback)
router.get('/event/:eventId/stats', getEventFeedbackStats)
router.get('/report/all', getFeedbackReport)

// Post routes
router.post('/submit', submitFeedback)

export default router
