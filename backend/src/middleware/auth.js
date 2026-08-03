const { verifyToken } = require('../services/authService');

/**
 * Gate for user-facing API routes. Requires a valid Bearer token in the
 * Authorization header. On success, attaches the decoded payload to req.user.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  try {
    req.user = verifyToken(token);
    // Expose the tenant on the request. Every scoped query reads req.hotelId,
    // which comes from the signed token — never from client-supplied input.
    req.hotelId = req.user.hotelId || null;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Sitzung ungültig oder abgelaufen.' });
  }
}

/**
 * Gate that ensures the authenticated request is bound to a tenant. Must run
 * AFTER requireAuth. Rejects legacy/tokens without a hotelId so no query can
 * ever run unscoped. This is the backstop for tenant isolation.
 */
function requireHotel(req, res, next) {
  if (!req.hotelId) {
    return res.status(403).json({ error: 'Kein Hotel-Kontext. Bitte neu anmelden.' });
  }
  return next();
}

/**
 * Gate for admin-only routes (e.g. user management). Must run AFTER requireAuth
 * so req.user is populated.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nur Administratoren dürfen das.' });
  }
  return next();
}

/**
 * Gate for the inbound-email webhook, which is called by an external mail
 * provider that cannot send a user JWT. Instead we require a shared secret,
 * accepted either as ?token=... or an X-Webhook-Token header — provider-agnostic.
 *
 * If INBOUND_WEBHOOK_SECRET is unset we fail closed (reject), because an
 * unauthenticated webhook lets anyone inject fake tickets.
 */
function requireWebhookSecret(req, res, next) {
  const expected = process.env.INBOUND_WEBHOOK_SECRET;

  if (!expected) {
    console.error(
      '[Webhook] INBOUND_WEBHOOK_SECRET is not set — rejecting inbound request.'
    );
    return res.status(503).json({ error: 'Webhook not configured.' });
  }

  const provided =
    req.query.token || req.headers['x-webhook-token'] || '';

  if (provided !== expected) {
    console.warn('[Webhook] Rejected inbound request with bad/missing token.');
    return res.status(401).json({ error: 'Invalid webhook token.' });
  }

  return next();
}

module.exports = { requireAuth, requireAdmin, requireHotel, requireWebhookSecret };
