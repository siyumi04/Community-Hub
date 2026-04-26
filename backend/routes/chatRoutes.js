import express from 'express';
import {
  sendMessage,
  getMessages,
  getStudentUnreadCount,
  deleteStudentMessage,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/send', sendMessage);
router.get('/unread/:communityId', getStudentUnreadCount);
router.delete('/message/:messageId', deleteStudentMessage);
router.get('/:communityId', getMessages);

export default router;
