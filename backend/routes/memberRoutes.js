import express from 'express'
import {
  getMembers,
  getPendingRequests,
  addMember,
  approveMember,
  rejectMember,
  promoteMember,
  removeMember,
  exportMembersCSV,
  getMemberStats,
} from '../controllers/memberController.js'
import { verifyAdminToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(verifyAdminToken)

// Get routes
router.get('/', getMembers)
router.get('/pending', getPendingRequests)
router.get('/stats', getMemberStats)
router.get('/export/csv', exportMembersCSV)

// Post routes
router.post('/add', addMember)

// Patch routes
router.patch('/:memberId/approve', approveMember)
router.patch('/:memberId/reject', rejectMember)
router.patch('/:memberId/promote', promoteMember)
router.patch('/:memberId/remove', removeMember)

export default router
