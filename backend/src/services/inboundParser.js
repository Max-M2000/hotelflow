const crypto = require('crypto');
const { simpleParser } = require('mailparser');

/**
 * Extract { address, name } from a "From" value that may be
 * "Anna Kowalski <anna@example.com>" or just "anna@example.com".
 */
const parseAddress = (value) => {
  if (!value || typeof value !== 'string') return { address: '', name: '' };
  const match = value.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim(), address: match[2].trim().toLowerCase() };
  }
  return { address: value.trim().toLowerCase(), name: '' };
};

/**
 * Deterministic id so re-delivery of the same email is deduplicated
 * even when the provider gives us no Message-ID.
 */
const makeEmailId = (from, subject, text) =>
  'sha:' + crypto.createHash('sha256').update(`${from}|${subject}|${text}`).digest('hex').slice(0, 24);

/**
 * Validate + shape a normalized email. Returns null if unusable.
 */
const build = ({ from, fromName, subject, text, emailId }) => {
  const parsed = parseAddress(from || '');
  const address = parsed.address;
  const cleanText = (text || '').toString().trim();
  const cleanSubject = (subject || '').toString().trim() || '(kein Betreff)';

  if (!address || !cleanText) return null;

  return {
    from: address,
    fromName: (fromName || parsed.name || '').trim(),
    subject: cleanSubject,
    text: cleanText,
    emailId: (emailId && String(emailId).trim()) || makeEmailId(address, cleanSubject, cleanText),
  };
};

/**
 * Normalize an inbound-email webhook payload from any common provider
 * into { from, fromName, subject, text, emailId }.
 * Provider-agnostic by design (Postmark, Mailgun, SendGrid, raw MIME, manual).
 *
 * @param {Object} payload - req.body from the inbound webhook
 * @returns {Promise<Object|null>}
 */
const normalizeInboundEmail = async (payload) => {
  if (!payload || typeof payload !== 'object') return null;

  // 1) Raw MIME (CloudMailin raw, SendGrid raw, generic) → parse with mailparser
  const rawMime = payload.raw || payload.mime || payload['body-mime'] || payload.email;
  if (typeof rawMime === 'string' && /content-type|^from:/im.test(rawMime)) {
    try {
      const p = await simpleParser(rawMime);
      const built = build({
        from: p.from?.value?.[0]?.address,
        fromName: p.from?.value?.[0]?.name,
        subject: p.subject,
        text: p.text || p.html,
        emailId: p.messageId,
      });
      if (built) return built;
    } catch (_) {
      /* fall through to structured parsing */
    }
  }

  // 2) Postmark inbound (JSON)
  if (payload.FromFull || payload.MessageID || payload.TextBody) {
    return build({
      from: payload.FromFull?.Email || payload.From,
      fromName: payload.FromFull?.Name,
      subject: payload.Subject,
      text: payload.StrippedTextReply || payload.TextBody || payload.HtmlBody,
      emailId: payload.MessageID,
    });
  }

  // 3) Mailgun routes
  if (payload.sender || payload['body-plain'] || payload['Message-Id']) {
    return build({
      from: payload.sender || payload.from,
      subject: payload.subject,
      text: payload['stripped-text'] || payload['body-plain'],
      emailId: payload['Message-Id'] || payload['message-id'],
    });
  }

  // 4) Generic / SendGrid Inbound Parse / manual test
  return build({
    from: payload.from,
    fromName: payload.fromName,
    subject: payload.subject,
    text: payload.text || payload.body || payload.html,
    emailId: payload.emailId || payload.messageId || payload['Message-Id'],
  });
};

module.exports = { normalizeInboundEmail, parseAddress, makeEmailId };
