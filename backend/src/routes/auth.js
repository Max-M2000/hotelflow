const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken } = require('../services/authService');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/login - exchange email + password for a JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });

    // Same generic message whether the user is missing, inactive, or the
    // password is wrong — don't reveal which emails exist.
    const invalid = () =>
      res.status(401).json({ error: 'E-Mail oder Passwort ist falsch.' });

    if (!user || !user.active) return invalid();

    const ok = await user.verifyPassword(password);
    if (!ok) return invalid();

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    return res.json({ token, user: user.toJSON() });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    return res.status(500).json({ error: 'Anmeldung fehlgeschlagen.' });
  }
});

// GET /api/auth/me - current user (used by the frontend to validate a stored token)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Sitzung ungültig.' });
    }
    return res.json({ user: user.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: 'Fehler beim Laden des Profils.' });
  }
});

// PATCH /api/auth/me - update the current user's own profile (name, signature)
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Sitzung ungültig.' });
    }
    const { name, signature } = req.body || {};
    if (name !== undefined) user.name = String(name).trim();
    if (signature !== undefined) user.signature = String(signature);
    await user.save();
    return res.json({ user: user.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: 'Profil konnte nicht gespeichert werden.' });
  }
});

module.exports = router;
