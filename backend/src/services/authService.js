const jwt = require('jsonwebtoken');

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';

/**
 * The signing secret. In production this MUST be set via env. We fail loudly
 * at call time (rather than silently using a weak default) so a misconfigured
 * deploy cannot hand out forgeable tokens.
 */
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET is not set (or too short). Set a long random JWT_SECRET env var.'
    );
  }
  return secret;
}

/**
 * Issue a signed JWT for a user. Keeps the payload minimal — just enough to
 * identify the user and their role without a DB round-trip on every request.
 */
function signToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      // Tenant binding: every scoped request derives its hotel from the token,
      // never from client input. A token without hotelId cannot access data.
      hotelId: user.hotelId ? String(user.hotelId) : undefined,
    },
    getSecret(),
    { expiresIn: TOKEN_TTL }
  );
}

/**
 * Verify a token and return its decoded payload. Throws on invalid/expired.
 */
function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken, TOKEN_TTL };
