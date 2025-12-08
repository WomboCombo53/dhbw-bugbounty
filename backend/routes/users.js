import express from 'express';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." }
});

const router = express.Router();

// Apply rate limiter to all routes in this router
router.use(limiter);

/**
 * POST /api/users
 * Body: { googleId }
 * creates or updates a user (Upsert) based on googleId.
 */
router.post('/', async (req, res) => {
  try {
    const { googleId } = req.body;

    if (!googleId || typeof googleId !== "string") {
      return res.status(400).json({ success: false, message: 'googleId is required and must be a string' });
    }

    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const user = await User.findOneAndUpdate({ googleId: { $eq: googleId } }, {}, options);

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error upserting user:', err);
    return res.status(500).json({ success: false, message: 'Error saving user', error: err.message });
  }
});

/**
 * GET /api/users/:id - get user based on id
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ success: false, message: 'Error fetching user', error: err.message });
  }
});

export default router;