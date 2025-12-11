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
 * Body: { teamName, department, description, teamleader, developers?} - create new Team
 */
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { teamName, department, description, teamleader, developers } = req.body;

    if (!teamName || !department || !description || !teamleader) {
      return res.status(400).json({
        success: false,
        message: "teamName, department, description and teamleader are required."
      });
    }

    // check for duplicate teamName
    const existing = await Team.findOne({ teamName });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A team with this name already exists."
      });
    }

    const newTeam = new Team({
      teamName,
      department,
      description,
      teamleader,
      developers: Array.isArray(developers) ? developers : []
    });

    await newTeam.save();

    return res.json({ success: true, data: newTeam });

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
router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, department, description, teamleader, developers } = req.body;

    // check if teamName is being updated to a duplicate
    if (teamName) {
      const duplicate = await Team.findOne({ teamName, _id: { $ne: id } });
      if (duplicate) {
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
 * DELETE /api/teams/:teamName - delete Team based on teamName
 */
router.delete('/:teamName', requireRole('admin'), async (req, res) => {
  try {
    const { teamName } = req.params;

    const deletedTeam = await Team.findOneAndDelete({ teamName });

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
