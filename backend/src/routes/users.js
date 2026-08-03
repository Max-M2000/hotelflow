const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth, requireAdmin, requireHotel } = require('../middleware/auth');

// All user-management routes require an authenticated admin bound to a hotel.
// Admins manage ONLY their own hotel's users.
router.use(requireAuth, requireHotel, requireAdmin);

// GET /api/users - list this hotel's users (newest first)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ hotelId: req.hotelId }).sort({ createdAt: -1 });
    res.json(users.map((u) => u.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - create a new user
router.post('/', async (req, res) => {
  try {
    const { email, password, name, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Das Passwort muss mindestens 8 Zeichen haben.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ error: 'Diese E-Mail wird bereits verwendet.' });
    }

    const passwordHash = await User.hashPassword(password);
    // New users are created inside the admin's own hotel (from the token),
    // never from client-supplied input.
    const user = await User.create({
      hotelId: req.hotelId,
      email: normalizedEmail,
      passwordHash,
      name: (name || '').trim(),
      role: role === 'admin' ? 'admin' : 'agent',
      active: true,
    });

    res.status(201).json(user.toJSON());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/users/:id - update name / role / active / password
router.patch('/:id', async (req, res) => {
  try {
    const { name, role, active, password } = req.body || {};
    // Scope to the admin's own hotel — cannot touch another tenant's users.
    const user = await User.findOne({ _id: req.params.id, hotelId: req.hotelId });
    if (!user) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });

    const isSelf = String(user._id) === req.user.sub;

    // Guard rails: an admin must not lock themselves out.
    if (isSelf && role !== undefined && role !== 'admin') {
      return res.status(400).json({ error: 'Du kannst dir selbst nicht die Admin-Rolle entziehen.' });
    }
    if (isSelf && active === false) {
      return res.status(400).json({ error: 'Du kannst dein eigenes Konto nicht deaktivieren.' });
    }

    if (name !== undefined) user.name = String(name).trim();
    if (role !== undefined) user.role = role === 'admin' ? 'admin' : 'agent';
    if (active !== undefined) user.active = !!active;
    if (password !== undefined && password !== '') {
      if (String(password).length < 8) {
        return res.status(400).json({ error: 'Das Passwort muss mindestens 8 Zeichen haben.' });
      }
      user.passwordHash = await User.hashPassword(password);
    }

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/users/:id - remove a user (never yourself)
router.delete('/:id', async (req, res) => {
  try {
    if (String(req.params.id) === req.user.sub) {
      return res.status(400).json({ error: 'Du kannst dein eigenes Konto nicht löschen.' });
    }
    // Scope to the admin's own hotel — cannot delete another tenant's users.
    const removed = await User.findOneAndDelete({ _id: req.params.id, hotelId: req.hotelId });
    if (!removed) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
