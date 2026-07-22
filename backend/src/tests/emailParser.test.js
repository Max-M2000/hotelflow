const { extractGuestName } = require('../services/emailParser');

describe('Email Parser', () => {
  test('should extract guest name from email', () => {
    const email = 'john.doe@example.com';
    const name = extractGuestName(email);
    expect(name).toBe('john doe');
  });

  test('should handle underscores', () => {
    const email = 'jane_smith@example.com';
    const name = extractGuestName(email);
    expect(name).toBe('jane smith');
  });

  test('should handle hyphens', () => {
    const email = 'mary-jane@example.com';
    const name = extractGuestName(email);
    expect(name).toBe('mary jane');
  });
});
