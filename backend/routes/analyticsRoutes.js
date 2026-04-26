import express from 'express'
import { getAnalyticsSummary, emailAnalyticsReport } from '../controllers/analyticsController.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyAdminToken)

router.get('/summary', getAnalyticsSummary)
router.post('/reports/email', emailAnalyticsReport)

export default router