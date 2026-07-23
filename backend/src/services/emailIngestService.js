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
  const { emailId, from, subject, body } = emailData;

  console.log(`[Ingest] Processing email: ${emailId} from ${from}`);

  // Step 1: Categorize email using OpenAI
  console.log(`[Ingest] Categorizing email...`);
  const { category, priority, sentiment } = await categorizeEmail(subject, body);
  console.log(`[Ingest] Categorized as: ${category} / ${priority} / ${sentiment}`);

  // Step 2: Route ticket to appropriate team
  console.log(`[Ingest] Routing to team...`);
  const assignedTo = await routeTicket(category, priority, sentiment);
  console.log(`[Ingest] Assigned to: ${assignedTo}`);

  // Step 3: Extract guest info
  console.log(`[Ingest] Extracting guest name...`);
  const guestName = extractGuestName(from);
  console.log(`[Ingest] Guest: ${guestName}`);

  // Step 4: Create ticket in database
  console.log(`[Ingest] Creating ticket in database...`);
  const ticket = await Ticket.create({
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
