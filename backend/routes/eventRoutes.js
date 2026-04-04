import express from 'express'
import {
  createEvent,
  getEvents,
  getEventDetails,
  updateEvent,
  deleteEvent,
  markAttendance,
  getEventStats,
} from '../controllers/eventController.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(verifyAdminToken)

// Get routes
router.get('/', getEvents)
router.get('/stats', getEventStats)
router.get('/:eventId', getEventDetails)

// Post routes
router.post('/create', createEvent)

// Patch routes
router.patch('/:eventId', updateEvent)
router.patch('/:eventId/attendance/:memberId', markAttendance)

// Delete routes
router.delete('/:eventId', deleteEvent)

export default router
