const Ticket = require('../models/Ticket');
const { categorizeEmail } = require('./categorizer');
const { routeTicket } = require('./routingEngine');
const { extractGuestName } = require('./emailParser');

/**
 * Full pipeline: Email → Categorize → Route → Create Ticket
 *
 * Process flow:
 * 1. Categorize the email (AI: category, priority, sentiment)
 * 2. Route to appropriate team based on rules
 * 3. Extract guest info from email
 * 4. Create ticket in database
 *
 * @param {Object} emailData - { emailId, from, subject, body }
 * @returns {Object} Created ticket with all enriched data
 */
const processIncomingEmail = async (emailData) => {
  const { emailId, from, subject, body, guestName: providedName, hotelId } = emailData;

  if (!hotelId) throw new Error('processIncomingEmail requires a hotelId');

  console.log(`[Ingest] Processing email: ${emailId} from ${from} (hotel ${hotelId})`);

  // Step 1: Categorize email using OpenAI (also extracts the guest's real name
  // from the message text / signature).
  console.log(`[Ingest] Categorizing email...`);
  const { category, priority, sentiment, guestName: aiName } = await categorizeEmail(
    subject,
    body,
    { fromName: providedName, fromEmail: from }
  );
  console.log(`[Ingest] Categorized as: ${category} / ${priority} / ${sentiment}`);

  // Step 2: Route ticket to appropriate team (scoped to this hotel's rules)
  console.log(`[Ingest] Routing to team...`);
  const assignedTo = await routeTicket(category, priority, sentiment, hotelId);
  console.log(`[Ingest] Assigned to: ${assignedTo}`);

  // Step 3: Guest name — prefer the real name the AI read from the message
  // (signature/greeting), then the email header display name, and only as a
  // last resort derive something from the address.
  const guestName =
    (aiName && aiName.trim()) ||
    (providedName && providedName.trim()) ||
    extractGuestName(from);
  console.log(`[Ingest] Guest: ${guestName}`);

  // Step 4: Create ticket in database
  console.log(`[Ingest] Creating ticket in database...`);
  const ticket = await Ticket.create({
    hotelId,
    emailId,
    guestEmail: from,
    guestName,
    subject,
    body,
    category,
    priority,
    sentiment,
    assignedTo,
    status: 'open',
    notes: [],
  });

  console.log(`[Ingest] ✅ Ticket created: ${ticket._id}`);
  return ticket;
};

module.exports = { processIncomingEmail };
