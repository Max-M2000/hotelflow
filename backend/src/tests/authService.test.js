const { signToken, verifyToken } = require('../services/authService');

describe('authService', () => {
  const OLD_ENV = process.env.JWT_SECRET;
  const user = { _id: 'abc123', email: 'admin@ospitara.de', role: 'admin' };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-that-is-long-enough-1234567890';
  });

  afterAll(() => {
    process.env.JWT_SECRET = OLD_ENV;
  });

  test('sign + verify round-trips the user claims', () => {
    const token = signToken(user);
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('abc123');
    expect(decoded.email).toBe('admin@ospitara.de');
    expect(decoded.role).toBe('admin');
  });

  test('verify rejects a tampered token', () => {
    const token = signToken(user);
    const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa');
    expect(() => verifyToken(tampered)).toThrow();
  });

  test('verify rejects a token signed with a different secret', () => {
    const token = signToken(user);
    process.env.JWT_SECRET = 'a-completely-different-secret-value-987654321';
    expect(() => verifyToken(token)).toThrow();
  });

  test('signing without a JWT_SECRET throws (fails closed)', () => {
    delete process.env.JWT_SECRET;
    expect(() => signToken(user)).toThrow(/JWT_SECRET/);
  });
});
