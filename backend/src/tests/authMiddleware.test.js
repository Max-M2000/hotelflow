const { requireAuth, requireAdmin, requireWebhookSecret } = require('../middleware/auth');
const { signToken } = require('../services/authService');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('requireAuth', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-that-is-long-enough-1234567890';
  });

  test('rejects a request with no Authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('rejects a malformed / non-Bearer header', () => {
    const req = { headers: { authorization: 'Basic foobar' } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('rejects an invalid token', () => {
    const req = { headers: { authorization: 'Bearer not.a.jwt' } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('accepts a valid token and attaches req.user', () => {
    const token = signToken({ _id: 'u1', email: 'a@b.de', role: 'admin' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.sub).toBe('u1');
    expect(req.user.role).toBe('admin');
  });
});

describe('requireAdmin', () => {
  test('rejects a non-admin user (403)', () => {
    const req = { user: { sub: 'u1', role: 'agent' } };
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  test('rejects when no user is attached (403)', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  test('lets an admin through', () => {
    const req = { user: { sub: 'u1', role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('requireWebhookSecret', () => {
  afterEach(() => {
    delete process.env.INBOUND_WEBHOOK_SECRET;
  });

  test('fails closed (503) when no secret is configured', () => {
    delete process.env.INBOUND_WEBHOOK_SECRET;
    const req = { query: {}, headers: {} };
    const res = mockRes();
    const next = jest.fn();
    requireWebhookSecret(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(503);
  });

  test('rejects a wrong token (401)', () => {
    process.env.INBOUND_WEBHOOK_SECRET = 'correct-secret';
    const req = { query: { token: 'wrong' }, headers: {} };
    const res = mockRes();
    const next = jest.fn();
    requireWebhookSecret(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('accepts the correct token via query param', () => {
    process.env.INBOUND_WEBHOOK_SECRET = 'correct-secret';
    const req = { query: { token: 'correct-secret' }, headers: {} };
    const res = mockRes();
    const next = jest.fn();
    requireWebhookSecret(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('accepts the correct token via X-Webhook-Token header', () => {
    process.env.INBOUND_WEBHOOK_SECRET = 'correct-secret';
    const req = { query: {}, headers: { 'x-webhook-token': 'correct-secret' } };
    const res = mockRes();
    const next = jest.fn();
    requireWebhookSecret(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
