const nodemailer = require('nodemailer');

// Provider-agnostic SMTP mailer. Configured for Zoho (EU) by default, but any
// SMTP host works via env vars. Credentials never live in code.
//
// Required env vars:
//   SMTP_HOST     e.g. smtp.zoho.eu
//   SMTP_PORT     465 (SSL) or 587 (STARTTLS)
//   SMTP_USER     info@ospitara.de
//   SMTP_PASS     app-specific password (Zoho: Settings → Security → App Passwords)
//   MAIL_FROM     optional display sender, defaults to "Ospitara <SMTP_USER>"

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS env vars.'
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit SSL, 587 = STARTTLS
    auth: { user, pass },
    // Fail fast instead of hanging forever if the port is blocked / host unreachable.
    connectionTimeout: 12000, // max time to establish TCP connection
    greetingTimeout: 12000,   // max time to wait for SMTP greeting
    socketTimeout: 20000,     // max idle time on the socket
  });

  return cachedTransporter;
};

/**
 * Send a reply email to a guest.
 * @param {Object} opts
 * @param {string} opts.to       Guest email address
 * @param {string} opts.subject  Email subject
 * @param {string} opts.body     Plain-text body
 * @param {string} [opts.inReplyTo] Original Message-ID for threading
 * @returns {Promise<{messageId: string}>}
 */
const sendReply = async ({ to, subject, body, inReplyTo }) => {
  const transporter = getTransporter();
  const from =
    process.env.MAIL_FROM || `Ospitara <${process.env.SMTP_USER}>`;

  const mail = {
    from,
    to,
    subject,
    text: body,
    // Convert newlines to <br> for a minimal HTML version.
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;white-space:pre-wrap">${escapeHtml(
      body
    )}</div>`,
  };

  // Thread the reply into the guest's original conversation if we know the ID.
  if (inReplyTo) {
    mail.inReplyTo = inReplyTo;
    mail.references = inReplyTo;
  }

  const info = await transporter.sendMail(mail);
  return { messageId: info.messageId };
};

const escapeHtml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

module.exports = { sendReply, getTransporter };
