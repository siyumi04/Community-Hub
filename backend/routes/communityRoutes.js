import express from 'express';
import {
    getAllCommunities,
    getCommunityById,
    joinCommunity,
    getCommunityMembers,
    leaveCommunity,
    getMembershipRequestStatus,
    getAdminMembershipRequests,
    approveMembershipRequest,
    rejectMembershipRequest
} from '../controllers/communityController.js';
import { protect, verifyAdminToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all communities
router.get('/', getAllCommunities);

// GET community by ID
router.get('/:communityId', getCommunityById);

// POST join community
router.post('/join', joinCommunity);

// Student request status by community
router.get('/:communityId/request-status/:studentId', protect, getMembershipRequestStatus);

// Admin membership approvals
router.get('/admin/member-requests', verifyAdminToken, getAdminMembershipRequests);
router.patch('/admin/member-requests/:requestId/approve', verifyAdminToken, approveMembershipRequest);
router.patch('/admin/member-requests/:requestId/reject', verifyAdminToken, rejectMembershipRequest);

// GET community members
router.get('/:communityId/members', getCommunityMembers);

// DELETE leave community
router.delete('/:communityId/:studentId', protect, leaveCommunity);

export default router;
