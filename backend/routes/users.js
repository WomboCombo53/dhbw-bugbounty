import express from 'express';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." }
});

const router = express.Router();

// Apply rate limiter to all routes in this router
router.use(limiter);

/**
 * Validation middleware
 */
const userValidation = [
  body('googleId')
    .trim()
    .notEmpty().withMessage('googleId is required')
    .isString().withMessage('googleId must be a string')
    .isLength({ max: 255 }).withMessage('googleId is too long'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),

  body('role')
    .optional()
    .isIn(['reporter', 'admin', 'developer'])
    .withMessage('Invalid role')
];

const userIdParamValidation = [
  param('id')
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid user id format')
];

function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}

/**
 * POST /api/users
 * Body: { googleId, email}
 * Create or update user based on googleId
 */
router.post('/', requireAuth, userValidation, async (req, res) => {
  try {
    // 🔹 Validation check (wie bugs.js)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { googleId, email } = req.body;

    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    };

    // only googleId (unique)
    const user = await User.findOneAndUpdate(
      { googleId },
      { email, lastSeen: new Date() },
      options
    );

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error upserting user:', err);
    res.status(500).json({
      success: false,
      message: 'Error saving user',
      error: err.message
    });
  }
});

/**
 * GET /api/users/:id
 * Admin only
 */
router.get('/:id', requireRole('admin'), userIdParamValidation, async (req, res) => {
  try {
    // 🔹 Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: err.message
    });
  }
});

export default router;