import express from 'express';
import Team from '../models/Team.js';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import lodash from "lodash";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." }
});

const router = express.Router();

// Apply rate limiter to all routes in this router
router.use(limiter);


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

const checkEmailsExist = async (emails) => {
  const foundUsers = await User.find({ email: { $in: emails } }).lean();
  if (foundUsers.length !== emails.length) {
    const foundEmails = foundUsers.map(u => u.email);
    const missing = emails.filter(e => !foundEmails.includes(e));
    throw new Error(`Users not found for emails: ${missing.join(', ')}`);
  }
};

const teamValidation = [
  body('teamName')
    .trim()
    .notEmpty().withMessage('Team name is required')
    .isLength({ max: 100 }).withMessage('Team name cannot exceed 100 characters'),

  body('department')
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),

  body('description')
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('teamleader')
      .trim()
      .notEmpty().withMessage('Teamleader email is required')
      .isEmail().withMessage('Teamleader must be a valid email'),

  body('developers')
    .optional()
    .isArray().withMessage('Developers must be an array')
    .custom(devs => {
      for (const email of devs) {
        if (!/\S+@\S+\.\S+/.test(email)) {
          throw new Error(`Invalid email: ${email}`);
        }
      }
      return true;
    })
];

/**
 * POST /api/teams
 * Body: { teamName, department, description, teamleader, developers?} - create new Team
 */
router.post('/', requireRole('admin'), teamValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    const { teamName, department, description, teamleader, developers } = req.body;

    // Check for duplicate teamName
    const existing = await Team.findOne({ teamName });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A team with this name already exists."
      });
    }

    // Verify teamleader and developers exist
    await checkEmailsExist([teamleader, ...(developers || [])]);
    
    //trim string fields
    const newTeam = new Team({
      teamName: teamName.trim(),
      department: department ? department.trim() : undefined,
      description: description ? description.trim() : undefined,
      teamleader: teamleader.trim(),
      developers: Array.isArray(developers) ? developers : []
    });

    await newTeam.save();

    return res.status(201).json({ success: true, data: newTeam });

  } catch (err) {
    console.error('Error creating team:', err);
    return res.status(500).json({
      success: false,
      message: 'Error creating team',
      error: err.message
    });
  }
});

/**
 * PATCH /api/teams/:id - update Team based on id
 */
router.patch('/:id', requireRole('admin'), teamValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    let { teamName, department, description, teamleader, developers } = req.body;

    // Trim string fields
    if (teamName) teamName = teamName.trim();
    if (department) department = department.trim();
    if (description) description = description.trim();
    if (teamleader) teamleader = teamleader.trim();

    if (teamleader || (developers && developers.length)) {
      await checkEmailsExist([teamleader, ...(developers || [])]);
    } 

    // Check duplicate teamName if updated
    if (teamName) {
      const existing = await Team.findOne({
        teamName: _.escape(teamName),
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Another team with this name already exists."
        });
      }
    }

    // Build update object
    const updateData = {};
    if (teamName !== undefined) updateData.teamName = teamName;
    if (department !== undefined) updateData.department = department;
    if (description !== undefined) updateData.description = description;
    if (teamleader !== undefined) updateData.teamleader = teamleader;
    if (developers !== undefined) updateData.developers = developers;

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }

    return res.json({ success: true, data: updatedTeam });

  } catch (err) {
    console.error('Error updating team:', err);
    return res.status(500).json({
      success: false,
      message: 'Error updating team',
      error: err.message
    });
  }
});

/**
 * GET /api/teams/ - get all teams with optional filters
 */
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { department, teamleader, limit = 50, skip = 0 } = req.query;

    // Build query filter
    const filter = {};
    if (department) filter.department = new RegExp(department, 'i');
    if (teamleader) filter.teamleader = new RegExp(teamleader, 'i');

    const teams = await Team.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Team.countDocuments(filter);

    res.json({
      success: true,
      data: teams,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: error.message
    });
  }
});

/**
 * GET /api/teams/:id - get Team based on id
 */
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).lean();
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    res.json({ success: true, data: team });
  } catch (err) {
    console.error('Error fetching Team:', err);
    res.status(500).json({ success: false, message: 'Error fetching Team', error: err.message });
  }
});

/**
 * DELETE /api/teams/:id - delete Team based on id
 */
router.delete('/:id', requireRole('admin') , async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const deletedTeam = await Team.findByIdAndDelete(id);
    if (!deletedTeam) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    return res.json({
      success: true,
      data: deletedTeam
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting team',
      error: err.message
    });
  }
});

export default router;
