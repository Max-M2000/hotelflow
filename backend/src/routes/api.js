const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// GET /api/tickets - List all tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tickets/:id - Get single ticket
router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets - Create ticket
router.post('/tickets', async (req, res) => {
  try {
    const { emailId, guestEmail, guestName, subject, body } = req.body;

    const ticket = await Ticket.create({
      emailId,
      guestEmail,
      guestName,
      subject,
      body,
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id - Update ticket status
router.patch('/tickets/:id', async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status, priority, assignedTo, updatedAt: new Date() },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets/:id/notes - Add note to ticket
router.post('/tickets/:id/notes', async (req, res) => {
  try {
    const { author, text } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $push: { notes: { author, text } },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
