import Student from '../models/Student.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const sanitizeStudent = (studentDoc) => {
  if (!studentDoc) return null;
  const student = typeof studentDoc.toObject === 'function' ? studentDoc.toObject() : { ...studentDoc };
  delete student.password;
  return student;
};

const generateAccessToken = (studentDoc) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign(
    {
      studentId: String(studentDoc._id),
      email: studentDoc.email,
    },
    jwtSecret,
    { expiresIn: JWT_EXPIRES_IN },
  );
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.status(200).json({
      success: true,
      data: students,
      message: 'Students retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
      message: 'Student retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new student
export const createStudent = async (req, res) => {
  try {
    const { name, firstName, lastName, itNumber, email, password, skills } = req.body;
    const normalizedName = name || `${firstName || ''} ${lastName || ''}`.trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedItNumber = String(itNumber || '').trim().toUpperCase();

    // Validation
    if (!normalizedName || !normalizedItNumber || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: name, itNumber, email, password',
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [{ email: normalizedEmail }, { itNumber: normalizedItNumber }] 
    });
    
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email or IT number already exists',
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);

    const newStudent = new Student({
      name: normalizedName,
      itNumber: normalizedItNumber,
      email: normalizedEmail,
      password: hashedPassword,
      skills: skills || [],
    });

    const savedStudent = await newStudent.save();

    res.status(201).json({
      success: true,
      data: sanitizeStudent(savedStudent),
      message: 'Student created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login student
export const loginStudent = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    let isPasswordValid = false;
    const storedPassword = String(student.password || '');

    if (BCRYPT_HASH_PATTERN.test(storedPassword)) {
      isPasswordValid = await bcrypt.compare(password, storedPassword);
    } else if (storedPassword && storedPassword === password) {
      isPasswordValid = true;
      // Legacy password migration: hash plain text password after successful login.
      student.password = await bcrypt.hash(password, SALT_ROUNDS);
      await student.save();
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateAccessToken(student);

    return res.status(200).json({
      success: true,
      data: sanitizeStudent(student),
      token,
      message: 'Login successful',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Forgot password reset
export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const itNumber = String(req.body?.itNumber || '').trim().toUpperCase();
    const newPassword = String(req.body?.newPassword || '');

    if (!email || !itNumber || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, IT number, and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const student = await Student.findOne({ email, itNumber });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No student found with the provided details',
      });
    }

    student.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Load full document so save() keeps all existing fields intact
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Apply each field explicitly — guarantees they reach MongoDB
    if (updates.name !== undefined)              student.name              = String(updates.name).trim();
    if (updates.email !== undefined)             student.email             = String(updates.email).trim().toLowerCase();
    if (updates.itNumber !== undefined)          student.itNumber          = String(updates.itNumber).trim().toUpperCase();
    if (updates.bio !== undefined)               student.bio               = String(updates.bio).trim();
    if (updates.favoriteCommunity !== undefined) student.favoriteCommunity = String(updates.favoriteCommunity).trim();
    if (updates.skills !== undefined)            student.skills            = updates.skills;

    if (updates.profilePicture !== undefined && updates.profilePicture !== '') {
      student.profilePicture = updates.profilePicture;
      console.log(`✅ Saving profilePicture for student ${id}, size: ${updates.profilePicture.length} bytes`);
    }

    if (updates.password) {
      if (String(updates.password).length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
      }
      student.password = await bcrypt.hash(String(updates.password), SALT_ROUNDS);
    }

    await student.save();

    // Return sanitized student (no password)
    const studentObj = student.toObject();
    delete studentObj.password;

    console.log(`✅ Student ${id} saved. ProfilePicture present: ${!!studentObj.profilePicture}`);

    res.status(200).json({
      success: true,
      data: studentObj,
      message: 'Student updated successfully',
    });
  } catch (error) {
    console.error(`❌ Error updating student:`, error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeStudent(student),
      message: 'Student deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
