import express from 'express'
import {
  createNotice,
  getNotices,
  getActiveNotices,
  updateNotice,
  archiveNotice,
  incrementViews,
  summarizeNotice,
} from '../controllers/noticeController.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public summarize route used by notice summarizer page
router.post('/summarize', summarizeNotice)

// Apply auth middleware to all routes
router.use(verifyAdminToken)

// Get routes
router.get('/', getNotices)
router.get('/active', getActiveNotices)

// Post routes
router.post('/create', createNotice)

// Patch routes
router.patch('/:noticeId', updateNotice)
router.patch('/:noticeId/archive', archiveNotice)
router.patch('/:noticeId/views', incrementViews)

export default router
