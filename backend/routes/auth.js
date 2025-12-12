import express from 'express';
import { OAuth2Client } from "google-auth-library";
import User from '../models/User.js';

const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(CLIENT_ID);

//validate session
router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(200).json({ loggedIn: false });

  res.json({
    loggedIn: true,
    user: req.session.user,
  });
});


// POST google login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    //store user in db
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const user = await User.findOneAndUpdate(
      {   googleId: { $eq: payload.sub }, email: { $eq: payload.email } },
      options
    );

    //create session
    req.session.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture || "https://www.gravatar.com/avatar/?d=mp",
      role: user.role,
    };

    res.json({ user: req.session.user });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, message: 'Could not log out' });
      }
      // Cookie auf Client-Seite ebenfalls löschen
      res.clearCookie('connect.sid'); // 'connect.sid' ist Standardname von express-session
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } else {
    res.json({ success: true, message: 'No session to destroy' });
  }
});


export default router;
