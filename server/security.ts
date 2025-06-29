// Enhanced Security System for GVPCEW Leave Management
// Comprehensive protection against unauthorized access and data breaches

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Rate limiting configuration to prevent abuse
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      console.log(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts. Please try again after 15 minutes.'
);

export const leaveApplicationRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // limit each IP to 10 leave applications per hour
  'Too many leave applications submitted. Please try again after 1 hour.'
);

export const generalRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests. Please try again later.'
);

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(`Unauthorized access attempt: User ${req.user?.id} (${userRole}) tried to access ${req.path}`);
      return res.status(403).json({ 
        error: 'Access denied',
        message: `This resource requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Enhanced authentication middleware with session validation
export const enhancedAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to continue'
    });
  }

  // Validate user still exists and is active
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user || !user.isActive) {
      req.logout((err) => {
        if (err) console.error('Logout error:', err);
      });
      return res.status(401).json({ 
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact administration.'
      });
    }

    // Update last activity
    console.log(`User activity: ${user.fullName} (${user.role}) accessed ${req.path}`);
    next();
  } catch (error) {
    console.error('Enhanced auth error:', error);
    return res.status(500).json({ error: 'Authentication validation failed' });
  }
};

// Data validation middleware for leave applications
export const validateLeaveApplication = (req: Request, res: Response, next: NextFunction) => {
  const { fromDate, toDate, reason, leaveType } = req.body;

  // Validate required fields
  if (!fromDate || !toDate || !reason || !leaveType) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'All fields (fromDate, toDate, reason, leaveType) are required'
    });
  }

  // Validate date format and range
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return res.status(400).json({
      error: 'Invalid date format',
      message: 'Please provide valid dates in YYYY-MM-DD format'
    });
  }

  if (from < today) {
    return res.status(400).json({
      error: 'Invalid date selection',
      message: 'Leave start date cannot be in the past'
    });
  }

  if (to < from) {
    return res.status(400).json({
      error: 'Invalid date range',
      message: 'End date must be after or equal to start date'
    });
  }

  // Validate reason length
  if (reason.length < 10) {
    return res.status(400).json({
      error: 'Invalid reason',
      message: 'Reason must be at least 10 characters long'
    });
  }

  // Validate leave type
  const validLeaveTypes = ['sick', 'casual', 'personal', 'emergency', 'other'];
  if (!validLeaveTypes.includes(leaveType)) {
    return res.status(400).json({
      error: 'Invalid leave type',
      message: `Leave type must be one of: ${validLeaveTypes.join(', ')}`
    });
  }

  next();
};

// File upload security validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only images, PDF, and Word documents are allowed'
    });
  }

  if (req.file.size > maxFileSize) {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 5MB'
    });
  }

  next();
};

// Audit logging system
export const auditLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        userId: req.user?.id || 'anonymous',
        userRole: req.user?.role || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        success: res.statusCode < 400
      };

      console.log('AUDIT LOG:', JSON.stringify(logEntry));
      
      // In production, send to dedicated logging service
      if (process.env.NODE_ENV === 'production') {
        // sendToLoggingService(logEntry);
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

// Session security validation
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    return res.status(500).json({ error: 'Session not available' });
  }

  // Check session expiry
  const sessionAge = Date.now() - (req.session.cookie.originalMaxAge || 0);
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  if (sessionAge > maxAge) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
    });
    return res.status(401).json({ 
      error: 'Session expired',
      message: 'Your session has expired. Please log in again.'
    });
  }

  next();
};

// IP whitelist for admin functions (if needed)
export const adminIPWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip;
    
    if (process.env.NODE_ENV === 'production' && !allowedIPs.includes(clientIP)) {
      console.log(`Blocked admin access from unauthorized IP: ${clientIP}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access is restricted to authorized networks'
      });
    }

    next();
  };
};

// Password strength validation
export const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
  }

  return { valid: true, message: 'Password meets security requirements' };
};

// Comprehensive security configuration
export const securityConfig = {
  rateLimits: {
    auth: authRateLimit,
    leaveApplication: leaveApplicationRateLimit,
    general: generalRateLimit
  },
  middleware: {
    headers: securityHeaders,
    sanitizeInput,
    enhancedAuth,
    validateSession,
    auditLogger
  },
  validation: {
    leaveApplication: validateLeaveApplication,
    fileUpload: validateFileUpload,
    passwordStrength: validatePasswordStrength
  },
  rbac: {
    requireRole,
    adminOnly: requireRole(['admin']),
    facultyOnly: requireRole(['faculty', 'admin']),
    studentFacultyOnly: requireRole(['student', 'faculty', 'admin'])
  }
};