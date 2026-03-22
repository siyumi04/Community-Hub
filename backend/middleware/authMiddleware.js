import jwt from 'jsonwebtoken';

const getTokenFromHeader = (authHeader = '') => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return '';
  }
  return authHeader.slice('Bearer '.length).trim();
};

export const protect = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization || '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured',
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.auth = {
      studentId: String(decoded.studentId || ''),
      email: decoded.email || '',
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireSameStudent = (req, res, next) => {
  const requestedStudentId = String(req.params.id || '');
  const authenticatedStudentId = String(req.auth?.studentId || '');

  if (!requestedStudentId || !authenticatedStudentId || requestedStudentId !== authenticatedStudentId) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to access this profile',
    });
  }

  return next();
};
