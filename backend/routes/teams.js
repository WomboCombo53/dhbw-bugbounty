import express from 'express';
import Team from '../models/Team.js';
import rateLimit from 'express-rate-limit';

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

/**
 * POST /api/teams
 * Body: { teamName, department, description, teamleader, developers?}
 * Creates or updates a Team (Upsert) based on teamName.
 */
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { teamName, department, description, teamleader, developers } = req.body;

    // Validate required fields
    if (!teamName || !department || !description || !teamleader) {
      return res.status(400).json({
        success: false,
        message: "teamName, department, description and teamleader are required."
      });
    }

    const updateData = {
      department,
      description,
      teamleader,
    };

    if (Array.isArray(developers)) updateData.developers = developers;

    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const team = await Team.findOneAndUpdate(
      { teamName: teamName },
      updateData,
      options
    );

    return res.json({ success: true, data: team });
  } catch (err) {
    console.error('Error upserting Team:', err);
    return res.status(500).json({ success: false, message: 'Error saving Team', error: err.message });
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

export default router;
