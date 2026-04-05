import express from 'express';
import {
    getAllCommunities,
    getCommunityById,
    joinCommunity,
    getCommunityMembers,
    leaveCommunity
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all communities
router.get('/', getAllCommunities);

// GET community by ID
router.get('/:communityId', getCommunityById);

// POST join community
router.post('/join', joinCommunity);

// GET community members
router.get('/:communityId/members', getCommunityMembers);

// DELETE leave community
router.delete('/:communityId/:studentId', protect, leaveCommunity);

export default router;
