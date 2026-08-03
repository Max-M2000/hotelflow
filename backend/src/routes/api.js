const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const RoutingRule = require('../models/RoutingRule');
const Hotel = require('../models/Hotel');
const { processIncomingEmail } = require('../services/emailIngestService');
const { normalizeInboundEmail } = require('../services/inboundParser');
const { sendReply } = require('../services/mailer');
const { draftReply } = require('../services/replyDrafter');
const Settings = require('../models/Settings');
const User = require('../models/User');
const {
  requireAuth,
  requireAdmin,
  requireHotel,
  requireWebhookSecret,
} = require('../middleware/auth');

// POST /api/inbound/email - Provider-agnostic inbound webhook (Channel #1)
// Receives forwarded emails from an inbound-parse service (Postmark/Mailgun/
// SendGrid/CloudMailin) or raw MIME, normalizes them, maps them to the right
// hotel (tenant) by the recipient address, and runs the pipeline.
// Authenticated by a shared secret (?token= or X-Webhook-Token), NOT a user JWT,
// because the caller is an external mail provider.
router.post('/inbound/email', requireWebhookSecret, async (req, res) => {
  try {
    const data = await normalizeInboundEmail(req.body);

    if (!data) {
      console.warn('[Inbound] Unparseable payload, keys:', Object.keys(req.body || {}));
      // 200 so the provider does not retry an email we will never parse.
      return res.status(200).json({ success: false, reason: 'unparseable' });
    }

    // Map the email to a tenant by the address it was delivered to.
    const hotel = await Hotel.findByInboundAddress(data.to);
    if (!hotel) {
      console.warn(`[Inbound] No hotel for recipient "${data.to}" — dropping email ${data.emailId}`);
      // 200: not our address / unknown tenant. Do not retry, do not create an
      // orphan ticket. Isolation first.
      return res.status(200).json({ success: false, reason: 'no-hotel' });
    }

    // Deduplicate within the hotel: same email delivered twice → no second ticket.
    const existing = await Ticket.findOne({ hotelId: hotel._id, emailId: data.emailId });
    if (existing) {
      console.log(`[Inbound] Duplicate ${data.emailId} → ticket ${existing._id}`);
      return res.status(200).json({ success: true, duplicate: true, ticketId: existing._id });
    }

    const ticket = await processIncomingEmail({
      hotelId: hotel._id,
      emailId: data.emailId,
      from: data.from,
      subject: data.subject,
      body: data.text,
      guestName: data.fromName,
    });

    console.log(`[Inbound] ✅ Ticket ${ticket._id} from ${data.from} → hotel ${hotel._id}`);
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

// Everything below requires an authenticated user bound to a tenant. The inbound
// webhook above is the only public endpoint (guarded by its own shared secret).
router.use(requireAuth, requireHotel);

// GET /api/setup/info - Forwarding address + inbound connection status (per hotel).
// Powers the in-app "Einrichtung" guide: shows THIS hotel which address to
// forward to and whether emails are already arriving.
router.get('/setup/info', requireAdmin, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.hotelId).select('inboundAddresses name');
    const last = await Ticket.findOne({ hotelId: req.hotelId })
      .sort({ createdAt: -1 })
      .select('createdAt');
    const totalTickets = await Ticket.countDocuments({ hotelId: req.hotelId });
    res.json({
      hotelName: hotel ? hotel.name : null,
      forwardingAddress: (hotel && hotel.inboundAddresses[0]) || null,
      lastEmailAt: last ? last.createdAt : null,
      totalTickets,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets/:id/suggest-reply - KI-Antwort-Entwurf (wird NICHT gesendet,
// nur als Vorschlag zurückgegeben; ein Mensch prüft, passt an und sendet).
router.post('/tickets/:id/suggest-reply', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, hotelId: req.hotelId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const settings = await Settings.getForHotel(req.hotelId);
    const me = await User.findOne({ _id: req.user.sub, hotelId: req.hotelId }).select('signature');
    const draft = await draftReply({
      guestName: ticket.guestName,
      subject: ticket.subject,
      body: ticket.body,
      category: ticket.category,
      sentiment: ticket.sentiment,
      houseInfo: settings.houseInfo,
      replyStyle: settings.replyStyle,
      styleNotes: settings.styleNotes,
    });
    if (!draft) {
      return res.status(502).json({ error: 'Entwurf konnte nicht erstellt werden.' });
    }
    // Signatur automatisch anhängen: persönliche des Mitarbeiters, sonst Haus-Signatur.
    const signature =
      (me && me.signature && me.signature.trim()) ||
      (settings.signature && settings.signature.trim()) ||
      'Mit freundlichen Grüßen';
    res.json({ draft: `${draft}\n\n${signature}` });
  } catch (error) {
    console.error('[SuggestReply] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ingest-email - Full pipeline (manual/test entry, scoped to caller's hotel)
router.post('/ingest-email', async (req, res) => {
  try {
    const { emailId, from, subject, body } = req.body;

    if (!emailId || !from || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields: emailId, from, subject, body',
      });
    }

    const ticket = await processIncomingEmail({
      hotelId: req.hotelId,
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

// GET /api/tickets - List this hotel's tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find({ hotelId: req.hotelId }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tickets/:id - Get single ticket (own hotel only)
router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, hotelId: req.hotelId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets - Create ticket (in this hotel)
router.post('/tickets', async (req, res) => {
  try {
    const { emailId, guestEmail, guestName, subject, body } = req.body;

    const ticket = await Ticket.create({
      hotelId: req.hotelId,
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

// PATCH /api/tickets/:id - Update ticket status (own hotel only)
router.patch('/tickets/:id', async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.hotelId },
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

// POST /api/tickets/:id/notes - Add note to ticket (own hotel only)
router.post('/tickets/:id/notes', async (req, res) => {
  try {
    const { author, text } = req.body;
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.hotelId },
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

// POST /api/tickets/:id/reply - Send an email reply to the guest (own hotel only)
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { subject, body, author } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Reply body is required' });
    }

    const ticket = await Ticket.findOne({ _id: req.params.id, hotelId: req.hotelId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (!ticket.guestEmail) {
      return res.status(400).json({ error: 'Ticket has no guest email address' });
    }

    const finalSubject =
      (subject && subject.trim()) || `Re: ${ticket.subject}`;

    // Thread into the guest's original conversation when we have a real Message-ID.
    const inReplyTo =
      ticket.emailId && ticket.emailId.includes('@') ? ticket.emailId : undefined;

    let result;
    try {
      result = await sendReply({
        to: ticket.guestEmail,
        subject: finalSubject,
        body: body.trim(),
        inReplyTo,
      });
    } catch (mailErr) {
      console.error('[Reply] Mail send failed:', mailErr.message);
      return res.status(502).json({ error: `E-Mail-Versand fehlgeschlagen: ${mailErr.message}` });
    }

    ticket.replies.push({
      author: author || 'Mitarbeiter',
      to: ticket.guestEmail,
      subject: finalSubject,
      body: body.trim(),
      messageId: result.messageId,
    });
    // First reply moves an open ticket into "in progress".
    if (ticket.status === 'open') ticket.status = 'in_progress';
    ticket.updatedAt = new Date();
    await ticket.save();

    console.log(`[Reply] ✅ Sent to ${ticket.guestEmail} (ticket ${ticket._id})`);
    res.json(ticket);
  } catch (error) {
    console.error('[Reply] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== Settings (signature + reply templates), per hotel =====

// GET /api/settings - this hotel's signature + reply templates
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.getForHotel(req.hotelId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/settings - update this hotel's signature and/or templates
router.patch('/settings', async (req, res) => {
  try {
    const { signature, templates, houseInfo, replyStyle, styleNotes } = req.body;
    const update = {};
    if (signature !== undefined) update.signature = signature;
    if (houseInfo !== undefined) update.houseInfo = String(houseInfo);
    if (replyStyle !== undefined) {
      const allowed = ['formal', 'professional', 'casual'];
      if (!allowed.includes(replyStyle)) {
        return res.status(400).json({ error: 'invalid replyStyle' });
      }
      update.replyStyle = replyStyle;
    }
    if (styleNotes !== undefined) update.styleNotes = String(styleNotes);
    if (templates !== undefined) {
      if (!Array.isArray(templates)) {
        return res.status(400).json({ error: 'templates must be an array' });
      }
      // Keep only valid entries with both a label and a body.
      update.templates = templates
        .filter((t) => t && t.label && t.body)
        .map((t) => ({ label: String(t.label), body: String(t.body) }));
    }

    // Ensure the settings doc exists for this hotel, then apply the update.
    await Settings.getForHotel(req.hotelId);
    const settings = await Settings.findOneAndUpdate(
      { hotelId: req.hotelId },
      { $set: update },
      { new: true, runValidators: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== Routing Rules, per hotel =====

// GET /api/routing-rules - list this hotel's rules
router.get('/routing-rules', async (req, res) => {
  try {
    const rules = await RoutingRule.find({ hotelId: req.hotelId }).sort({ createdAt: 1 });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/routing-rules - create a rule (in this hotel)
router.post('/routing-rules', async (req, res) => {
  try {
    const { category, priority, sentiment, assignTo, active } = req.body;
    if (!category || !assignTo) {
      return res.status(400).json({ error: 'category and assignTo are required' });
    }
    const rule = await RoutingRule.create({
      hotelId: req.hotelId,
      category,
      priority: priority || undefined,
      sentiment: sentiment || undefined,
      assignTo,
      active: active !== false,
    });
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/routing-rules/:id - update a rule (own hotel only)
router.patch('/routing-rules/:id', async (req, res) => {
  try {
    const { assignTo, priority, sentiment, active } = req.body;
    const update = {};
    if (assignTo !== undefined) update.assignTo = assignTo;
    if (priority !== undefined) update.priority = priority || undefined;
    if (sentiment !== undefined) update.sentiment = sentiment || undefined;
    if (active !== undefined) update.active = active;

    const rule = await RoutingRule.findOneAndUpdate(
      { _id: req.params.id, hotelId: req.hotelId },
      update,
      { new: true, runValidators: true }
    );
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/routing-rules/:id - delete a rule (own hotel only)
router.delete('/routing-rules/:id', async (req, res) => {
  try {
    const removed = await RoutingRule.findOneAndDelete({
      _id: req.params.id,
      hotelId: req.hotelId,
    });
    if (!removed) return res.status(404).json({ error: 'Rule not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/routing-rules/seed-defaults - create sensible defaults for this hotel
// (only if it has none yet)
router.post('/routing-rules/seed-defaults', async (req, res) => {
  try {
    const existing = await RoutingRule.countDocuments({ hotelId: req.hotelId });
    if (existing > 0) {
      return res.status(200).json({ success: true, skipped: true, message: 'Rules already exist', count: existing });
    }
    const defaults = [
      { category: 'complaint', assignTo: 'Management' },
      { category: 'booking', assignTo: 'Reservierung' },
      { category: 'inquiry', assignTo: 'Rezeption' },
      { category: 'other', assignTo: 'Rezeption' },
    ].map((d) => ({ ...d, hotelId: req.hotelId }));
    const created = await RoutingRule.insertMany(defaults);
    res.status(201).json({ success: true, created: created.length, rules: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
