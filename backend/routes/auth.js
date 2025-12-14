import express from 'express';
import { OAuth2Client } from "google-auth-library";
import { upsertUserFromGoogle } from './users.js';

const router = express.Router();

// KEIN Secret, die Client ID darf öffentlich sein
const CLIENT_ID = "533923725466-j9bdmlol98gt7abptshpnpggdd7i5iuk.apps.googleusercontent.com";
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

    //upsert user in db
    const user = await upsertUserFromGoogle(payload);
    console.log('User upserted:', user);
    
    //create session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      picture: payload.picture || "https://www.gravatar.com/avatar/?d=mp", //load default avatar if none provided by google
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
