import express from 'express'
import { getRecommendedEvents } from '../controllers/recommendationController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET AI-recommended events for a student
// Requires student authentication
router.get('/:studentId', protect, getRecommendedEvents)

export default router
