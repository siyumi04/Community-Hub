import express from 'express';
import { sendMessage, getMessages } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes require auth
router.use(protect);

// POST /api/chat/send — send a message (with AI toxicity check)
router.post('/send', sendMessage);

// GET /api/chat/:communityId — get messages for the logged-in student
router.get('/:communityId', getMessages);

export default router;
