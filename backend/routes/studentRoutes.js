import express from 'express';
import {
    getAllStudents,
    getStudentById,
    createStudent,
    loginStudent,
    forgotPassword,
    updateStudent,
    deleteStudent
} from '../controllers/studentController.js';
import { protect, requireSameStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all students
router.get('/', protect, getAllStudents);

// GET student by ID
router.get('/:id', protect, requireSameStudent, getStudentById);

// POST create new student
router.post('/', createStudent);

// POST student login
router.post('/login', loginStudent);

// POST forgot password
router.post('/forgot-password', forgotPassword);

// PUT update student
router.put('/:id', protect, requireSameStudent, updateStudent);

// DELETE student
router.delete('/:id', protect, requireSameStudent, deleteStudent);

export default router;
