import express from 'express';
import { body, validationResult } from 'express-validator';
import Bug from '../models/Bug.js';

const router = express.Router();

// Validation middleware
const bugValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
  body('reporterEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('bountyAmount')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Bounty amount must be a positive number')
];

// GET /api/bugs - Get all bugs
router.get('/', async (req, res) => {
  try {
    const { severity, status, companyName, limit = 50, skip = 0 } = req.query;
    
    // Build query filter
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (companyName) filter.companyName = new RegExp(companyName, 'i');
    
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
router.get('/:id', async (req, res) => {
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
router.post('/', bugValidation, async (req, res) => {
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
      companyName: req.body.companyName,
      reporterEmail: req.body.reporterEmail,
      bountyAmount: req.body.bountyAmount || null,
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

// PATCH /api/bugs/:id - Update bug status
router.patch('/:id', async (req, res) => {
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

// DELETE /api/bugs/:id - Delete a bug report (admin only - add auth later)
router.delete('/:id', async (req, res) => {
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
router.get('/statistics/summary', async (req, res) => {
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
