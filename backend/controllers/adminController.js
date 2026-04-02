import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const sanitizeAdmin = (adminDoc) => {
  if (!adminDoc) return null;
  const admin = typeof adminDoc.toObject === 'function' ? adminDoc.toObject() : { ...adminDoc };
  delete admin.password;
  return admin;
};

const generateAccessToken = (adminDoc) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign(
    {
      adminId: String(adminDoc._id),
      email: adminDoc.email,
      username: adminDoc.username,
      role: 'admin'
    },
    jwtSecret,
    { expiresIn: JWT_EXPIRES_IN },
  );
};

// Create Admin Account
export const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, itNumber, email, dashboardName, username, password, confirmPassword } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !itNumber || !email || !dashboardName || !username || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if admin already exists with same email
    const existingAdminEmail = await Admin.findOne({ email });
    if (existingAdminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Check if IT Number already exists
    const existingItNumber = await Admin.findOne({ itNumber });
    if (existingItNumber) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this IT Number already exists'
      });
    }

    // Check if dashboard name already exists
    const existingDashboard = await Admin.findOne({ dashboardName });
    if (existingDashboard) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard name already taken'
      });
    }

    // Check if username already exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create new admin (save plain text password as requested)
    const admin = new Admin({
      firstName,
      lastName,
      itNumber,
      email,
      dashboardName,
      username,
      password: password
    });

    await admin.save();

    // Generate token
    const token = generateAccessToken(admin);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        admin: sanitizeAdmin(admin),
        token
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating admin account'
    });
  }
};

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check password (plain text comparison)
    if (password !== admin.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateAccessToken(admin);

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      data: {
        admin: sanitizeAdmin(admin),
        token
      }
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in'
    });
  }
};

// Get all admins (public - for displaying credentials on login)
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({
      success: true,
      data: admins,
      message: 'Admins retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get admin by ID
export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
      message: 'Admin retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
