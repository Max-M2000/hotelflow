const nodemailer = require('nodemailer');
const axios = require('axios');
const {
  SESv2Client,
  SendEmailCommand,
} = require('@aws-sdk/client-sesv2');

// Provider-agnostic mailer. Three transports, chosen by which env vars are set
// (priority: SES → Resend → SMTP). All HTTPS transports work on hosts that
// block outbound SMTP (e.g. Railway).
//   1. Amazon SES (HTTPS API, port 443) — long-term choice: cheapest at scale,
//      no monthly cap. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION.
//   2. Resend (HTTPS API) — set RESEND_API_KEY.
//   3. SMTP (nodemailer) — fallback, e.g. Zoho. Blocked by some hosts.
//
// Env vars:
//   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION  → send via SES
//   RESEND_API_KEY                                          → send via Resend
//   MAIL_FROM       display sender, e.g. "Ospitara <info@ospitara.de>"
//   SMTP_HOST/PORT/USER/PASS  SMTP fallback config

const escapeHtml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildHtml = (body) =>
  `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;white-space:pre-wrap">${escapeHtml(
    body
  )}</div>`;

const resolveFrom = () =>
  process.env.MAIL_FROM ||
  (process.env.SMTP_USER ? `Ospitara <${process.env.SMTP_USER}>` : null);

// ---- Transport 1: Amazon SES (HTTPS API) ----
let cachedSesClient = null;

const getSesClient = () => {
  if (cachedSesClient) return cachedSesClient;
  cachedSesClient = new SESv2Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    // Credentials are read automatically from AWS_ACCESS_KEY_ID /
    // AWS_SECRET_ACCESS_KEY env vars by the SDK's default provider chain.
  });
  return cachedSesClient;
};

const sendViaSes = async ({ to, subject, body, inReplyTo }) => {
  const from = resolveFrom();
  if (!from) {
    throw new Error('MAIL_FROM not set — required for SES sending.');
  }

  const command = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: body, Charset: 'UTF-8' },
          Html: { Data: buildHtml(body), Charset: 'UTF-8' },
        },
        ...(inReplyTo
          ? {
              Headers: [
                { Name: 'In-Reply-To', Value: inReplyTo },
                { Name: 'References', Value: inReplyTo },
              ],
            }
          : {}),
      },
    },
  });

  const result = await getSesClient().send(command);
  return { messageId: result.MessageId };
};

// ---- Transport 2: Resend (HTTP API) ----
const sendViaResend = async ({ to, subject, body, inReplyTo }) => {
  const from = resolveFrom();
  if (!from) {
    throw new Error('MAIL_FROM not set — required for Resend sending.');
  }

  const payload = {
    from,
    to: [to],
    subject,
    text: body,
    html: buildHtml(body),
  };

  // Thread the reply into the guest's original conversation if we know the ID.
  if (inReplyTo) {
    payload.headers = {
      'In-Reply-To': inReplyTo,
      References: inReplyTo,
    };
  }

  const { data } = await axios.post('https://api.resend.com/emails', payload, {
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  return { messageId: data.id };
};

// ---- Transport 2: SMTP (nodemailer) ----
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
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
  });

  return cachedTransporter;
};

const sendViaSmtp = async ({ to, subject, body, inReplyTo }) => {
  const transporter = getTransporter();
  const from = resolveFrom();

  const mail = { from, to, subject, text: body, html: buildHtml(body) };
  if (inReplyTo) {
    mail.inReplyTo = inReplyTo;
    mail.references = inReplyTo;
  }

  const info = await transporter.sendMail(mail);
  return { messageId: info.messageId };
};

/**
 * Send a reply email to a guest. Uses Resend if RESEND_API_KEY is set,
 * otherwise falls back to SMTP.
 * @param {Object} opts
 * @param {string} opts.to        Guest email address
 * @param {string} opts.subject   Email subject
 * @param {string} opts.body      Plain-text body
 * @param {string} [opts.inReplyTo] Original Message-ID for threading
 * @returns {Promise<{messageId: string}>}
 */
const sendReply = async (opts) => {
  // Priority 1: Amazon SES
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return sendViaSes(opts);
  }

  // Priority 2: Resend
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResend(opts);
    } catch (err) {
      // Surface Resend's API error message (it nests under response.data).
      const apiMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message;
      throw new Error(apiMsg);
    }
  }

  // Priority 3: SMTP fallback
  return sendViaSmtp(opts);
};

module.exports = { sendReply, getTransporter };
