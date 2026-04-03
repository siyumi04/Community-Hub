import express from 'express';
import { summarizeNotice } from '../controllers/noticeController.js';

const router = express.Router();

// POST /api/notices/summarize
router.post('/summarize', summarizeNotice);

export default router;
