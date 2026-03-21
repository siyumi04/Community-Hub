import express from 'express';
import {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} from '../controllers/studentController.js';

const router = express.Router();

// GET all students
router.get('/', getAllStudents);

// GET student by ID
router.get('/:id', getStudentById);

// POST create new student
router.post('/', createStudent);

// PUT update student
router.put('/:id', updateStudent);

// DELETE student
router.delete('/:id', deleteStudent);

export default router;
