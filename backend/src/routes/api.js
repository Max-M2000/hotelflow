const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { processIncomingEmail } = require('../services/emailIngestService');
const { normalizeInboundEmail } = require('../services/inboundParser');

// POST /api/inbound/email - Provider-agnostic inbound webhook (Channel #1)
// Receives forwarded emails from an inbound-parse service (Postmark/Mailgun/
// SendGrid/CloudMailin) or raw MIME, normalizes them, and runs the pipeline.
router.post('/inbound/email', async (req, res) => {
  try {
    const data = await normalizeInboundEmail(req.body);

    if (!data) {
      console.warn('[Inbound] Unparseable payload, keys:', Object.keys(req.body || {}));
      // 200 so the provider does not retry an email we will never parse.
      return res.status(200).json({ success: false, reason: 'unparseable' });
    }

    // Deduplicate: same email delivered twice → no second ticket.
    const existing = await Ticket.findOne({ emailId: data.emailId });
    if (existing) {
      console.log(`[Inbound] Duplicate ${data.emailId} → ticket ${existing._id}`);
      return res.status(200).json({ success: true, duplicate: true, ticketId: existing._id });
    }

    const ticket = await processIncomingEmail({
      emailId: data.emailId,
      from: data.from,
      subject: data.subject,
      body: data.text,
      guestName: data.fromName,
    });

    console.log(`[Inbound] ✅ Ticket ${ticket._id} from ${data.from}`);
    return res.status(201).json({ success: true, ticketId: ticket._id });
  } catch (error) {
    // Duplicate-key race → treat as already processed.
    if (error.code === 11000) {
      return res.status(200).json({ success: true, duplicate: true });
    }
    console.error('[Inbound] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/ingest-email - Full pipeline: Email → Categorize → Route → Create Ticket
router.post('/ingest-email', async (req, res) => {
  try {
    const { emailId, from, subject, body } = req.body;

    // Validate required fields
    if (!emailId || !from || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields: emailId, from, subject, body',
      });
    }

    // Process email through full pipeline
    const ticket = await processIncomingEmail({
      emailId,
      from,
      subject,
      body,
    });

    res.status(201).json({
      success: true,
      ticket,
      pipeline: {
        step1: 'Categorized by AI',
        step2: 'Routed to team',
        step3: 'Guest extracted',
        step4: 'Ticket created',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
