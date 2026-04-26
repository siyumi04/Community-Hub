import express from 'express';
import { verifyAdminToken } from '../middleware/authMiddleware.js';
import {
  getAdminUnreadTotal,
  getAdminConversations,
  getAdminThread,
  sendAdminMessage,
  deleteAdminMessage,
} from '../controllers/chatAdminController.js';

const router = express.Router();

router.use(verifyAdminToken);

router.get('/unread-total', getAdminUnreadTotal);
router.get('/conversations', getAdminConversations);
router.get('/thread/:studentId', getAdminThread);
router.post('/send', sendAdminMessage);
router.delete('/message/:messageId', deleteAdminMessage);

export default router;
