import express from 'express';
import { body, validationResult } from 'express-validator';
import Bug from '../models/Bug.js';
import Team from '../models/Team.js';
import mongoose from 'mongoose';

const router = express.Router();

const TEXT_REGEX = /^[a-zA-Z0-9 äöüÄÖÜß.,:;!?()\-_'"\n\r]+$/;
const NAME_REGEX = /^[a-zA-Z0-9 äöüÄÖÜß\-'.]+$/;

// Validation middleware
const bugValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters')
    .matches(TEXT_REGEX).withMessage('Title contains invalid characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters')
    .matches(TEXT_REGEX).withMessage('Description contains invalid characters'),

  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),

  body('productName')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 100 }).withMessage('Product name cannot exceed 100 characters')
    .matches(NAME_REGEX).withMessage('Product name contains invalid characters'),
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

// GET /api/bugs - Get all bugs
router.get('/', requireAuth, async (req, res) => {
  try {
    const { severity, status, productName, limit = 50, skip = 0 } = req.query;
    
    // Build query filter
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (productName) filter.productName = new RegExp(productName, 'i');
    
    const bugs = await Bug.find(filter)
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    const total = await Bug.countDocuments(filter);
    
    res.json({
      success: true,
      data: bugs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error fetching bugs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bug reports',
      error: error.message
    });
  }
});

// GET /api/bugs/:id - Get a single bug by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }
    
    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    console.error('Error fetching bug:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bug report',
      error: error.message
    });
  }
});

// POST /api/bugs - Create a new bug report
router.post('/', requireAuth, bugValidation, async (req, res) => {
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
    
    const bugData = {
      title: req.body.title,
      description: req.body.description,
      severity: req.body.severity,
      productName: req.body.productName,
      reporterEmail: req.session.user.email, // use email from session
      status: 'open',
      submittedAt: new Date()
    };
    
    const bug = new Bug(bugData);
    await bug.save();
    
    res.status(201).json({
      success: true,
      message: 'Bug report submitted successfully',
      data: bug
    });
  } catch (error) {
    console.error('Error creating bug:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting bug report',
      error: error.message
    });
  }
});

// PATCH /api/bugs/:bugId/assign-team - Assign bug to a team
router.patch('/:bugId/assign-team', requireRole('admin'), async (req, res) => {
  const { bugId } = req.params;
  const { teamId } = req.body; // ObjectId oder null

  if (!mongoose.Types.ObjectId.isValid(bugId)) {
    return res.status(400).json({ success: false, message: "Invalid bugId" });
  }

  if (teamId && !mongoose.Types.ObjectId.isValid(teamId)) {
    return res.status(400).json({ success: false, message: "Invalid teamId" });
  }

  try {
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({ success: false, message: "Bug not found" });
    }

    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }
      bug.assignedTeam = team._id;
    } else {
      bug.assignedTeam = null;
    }

    await bug.save();

    // Populate assignedTeam field before sending response
    const populatedBug = await bug.populate('assignedTeam');

    res.json({ success: true, data: populatedBug });
  } catch (err) {
    console.error('Assign team error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/bugs/:id - Update bug status
router.patch('/:id', requireRole('admin', 'developer'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    if (!['open', 'in-progress', 'resolved', 'closed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const bug = await Bug.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Bug status updated successfully',
      data: bug
    });
  } catch (error) {
    console.error('Error updating bug:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bug report',
      error: error.message
    });
  }
});

// DELETE /api/bugs/:id - Delete a bug report
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const bug = await Bug.findByIdAndDelete(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Bug report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bug:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bug report',
      error: error.message
    });
  }
});

// GET /api/bugs/stats - Get statistics
router.get('/statistics/summary', requireRole('admin'), async (req, res) => {
  try {
    const stats = await Bug.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          bySeverity: {
            $push: '$severity'
          },
          byStatus: {
            $push: '$status'
          },
          totalBounty: {
            $sum: { $ifNull: ['$bountyAmount', 0] }
          }
        }
      }
    ]);
    
    const severityCounts = stats[0]?.bySeverity.reduce((acc, severity) => {
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {}) || {};
    
    const statusCounts = stats[0]?.byStatus.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    res.json({
      success: true,
      data: {
        total: stats[0]?.total || 0,
        severityCounts,
        statusCounts,
        totalBounty: stats[0]?.totalBounty || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

export default router;
