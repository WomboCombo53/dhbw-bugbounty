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
const GOOGLE_ID_REGEX = /^[a-zA-Z0-9_-]{1,255}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-Z0-9 äöüÄÖÜß\-_.()]{1,100}$/;

const userValidation = [
  body('googleId')
    .trim()
    .notEmpty().withMessage('googleId is required')
    .matches(GOOGLE_ID_REGEX).withMessage('Invalid googleId format'),

  body('email')
    .trim()
    .normalizeEmail()
    .notEmpty().withMessage('Email is required')
    .matches(EMAIL_REGEX).withMessage('Invalid email address'),
    
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .matches(NAME_REGEX).withMessage('Invalid name format'),

  body('role')
    .optional()
    .isIn(['reporter', 'admin', 'developer'])
    .withMessage('Invalid role'),
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
  return async (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const dbUser = await User.findById(req.session.user.id);
    if (!dbUser || !roles.includes(dbUser.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}

export async function upsertUserFromGoogle(payload) {
  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name;

  // check if first user to assign admin role
  const adminExists = await User.exists({ role: 'admin' });
  const role = adminExists ? 'reporter' : 'admin';

  const update = {
     $set: {
      email,
      name,
      lastSeen: new Date()
    },
    $setOnInsert: {
      googleId,
      role
    }
  };

  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  return await User.findOneAndUpdate({ googleId }, update, options);
}

/**
 * GET /api/users/:id
 * Admin only
 */
router.get('/:id', requireAuth, requireRole('admin'), userIdParamValidation, async (req, res) => {
  try {
    // Validation check
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

/**
 * GET /api/users
 * Admin only – list all users
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role googleId createdAt lastSeen')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: err.message
    });
  }
});

export default router;