import Student from '../models/Student.js';

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
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
    const student = await Student.findById(id);

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

    // Validation
    if (!normalizedName || !itNumber || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: name, itNumber, email, password',
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [{ email }, { itNumber }] 
    });
    
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email or IT number already exists',
      });
    }

    const newStudent = new Student({
      name: normalizedName,
      itNumber,
      email,
      password,
      skills: skills || [],
    });

    const savedStudent = await newStudent.save();

    res.status(201).json({
      success: true,
      data: savedStudent,
      message: 'Student created successfully',
    });
  } catch (error) {
    res.status(500).json({
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

    const student = await Student.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  } catch (error) {
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
      data: student,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
