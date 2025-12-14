import express from 'express';
import Team from '../models/Team.js';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." }
});

const router = express.Router();

// Apply rate limiter to all routes in this router
router.use(limiter);


function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      // Check authentication
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      // Fetch user role from database
      const dbUser = await User.findById(req.session.user.id)
        .select('role');

      // Check if user has one of the required roles
      if (!dbUser || !roles.includes(dbUser.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      req.userRole = dbUser.role;

      next();
    } catch (err) {
      console.error('Role check failed:', err);
      res.status(500).json({ success: false, message: 'Authorization failed' });
    }
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

async function recalcDeveloperRoles(emails) {
  for (const email of emails) {
    const isStillInTeam = await Team.exists({
      $or: [
        { teamleader: email },
        { developers: email }
      ]
    });

    if (!isStillInTeam) {
      await User.updateOne(
        { email, role: 'developer' },
        { $set: { role: 'reporter' } }
      );
    }
  }
}

const NAME_REGEX = /^[a-zA-Z0-9 äöüÄÖÜß\-_.()]{1,100}$/;
const TEXT_REGEX = /^[a-zA-Z0-9 äöüÄÖÜß.,:;!?()\-_'"\n\r]{1,2000}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const teamCreateValidation = [
  body('teamName')
    .trim()
    .notEmpty().withMessage('Team name is required')
    .isLength({ max: 100 }).withMessage('Team name cannot exceed 100 characters')
    .matches(NAME_REGEX).withMessage('Team name contains invalid characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters')
    .matches(NAME_REGEX).withMessage('Department contains invalid characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters')
    .matches(TEXT_REGEX).withMessage('Description contains invalid characters'),

  body('teamleader')
    .trim()
    .notEmpty().withMessage('Teamleader email is required')
    .matches(EMAIL_REGEX).withMessage('Teamleader must be a valid email'),

  body('developers')
    .optional()
    .isArray({ max: 50 }).withMessage('Developers must be an array'),
  
  body('developers.*')
    .trim()
    .matches(EMAIL_REGEX).withMessage('Invalid developer email'),
];

const teamUpdateValidation = [
  body('teamName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Team name cannot exceed 100 characters')
    .matches(NAME_REGEX).withMessage('Team name contains invalid characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters')
    .matches(NAME_REGEX).withMessage('Department contains invalid characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters')
    .matches(TEXT_REGEX).withMessage('Description contains invalid characters'),

  body('teamleader')
    .optional()
    .trim()
    .matches(EMAIL_REGEX).withMessage('Teamleader must be a valid email'),

  body('developers')
    .optional()
    .isArray({ max: 50 }).withMessage('Developers must be an array'),

  body('developers.*')
    .optional()
    .trim()
    .matches(EMAIL_REGEX).withMessage('Invalid developer email'),
];


/**
 * POST /api/teams
 * Body: { teamName, department, description, teamleader, developers?} - create new Team
 */
router.post('/', requireRole('admin'), teamCreateValidation, async (req, res) => {
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

    //change role of reporters to developer if they are assigned to a team
    const emailsToUpdate = [teamleader, ...(developers || [])];
    await User.updateMany(
      { email: { $in: emailsToUpdate }, role: 'reporter' },
      { $set: { role: 'developer' } }
    );

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
router.patch('/:id', requireRole('admin'), teamUpdateValidation, async (req, res) => {
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
        teamName: teamName,
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

    const oldTeam = await Team.findById(id);
    if (!oldTeam) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const updatedTeam = await Team.findByIdAndUpdate(id, updateData, { new: true });

    // Recalculate roles of removed developers
    const oldEmails = new Set([
      oldTeam.teamleader,
      ...(oldTeam.developers || [])
    ]);

    const newEmails = new Set([
      updatedTeam.teamleader,
      ...(updatedTeam.developers || [])
    ]);

    const removedEmails = [...oldEmails].filter(e => !newEmails.has(e));
    const addedEmails = [...newEmails].filter(e => !oldEmails.has(e));

    // downgrade roles of removed developers if they are no longer in any team
    await recalcDeveloperRoles(removedEmails);

    // added → upgrade
    await User.updateMany(
      { email: { $in: addedEmails }, role: 'reporter' },
      { $set: { role: 'developer' } }
);
    return res.json({
      success: true,
      data: updatedTeam
    });

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

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const affectedEmails = [
      team.teamleader,
      ...(team.developers || [])
    ];

    await team.deleteOne();
    await recalcDeveloperRoles(affectedEmails);

    return res.json({
      success: true,
      data: team
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
