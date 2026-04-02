import express from 'express';
import {
    createAdmin,
    loginAdmin,
    getAllAdmins,
    getAdminById
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST create admin account
router.post('/register', createAdmin);

// POST admin login
router.post('/login', loginAdmin);

// GET all admins (public)
router.get('/credentials', getAllAdmins);

export default router;
