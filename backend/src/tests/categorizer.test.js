// Mock OpenAI BEFORE importing categorizer
let mockCreate;

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args) => mockCreate(...args),
      },
    },
  }));
});

const { categorizeEmail } = require('../services/categorizer');

describe('Email Categorizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock behavior
    mockCreate = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: '{"category": "other", "priority": "medium", "sentiment": "neutral"}',
          },
        },
      ],
    });
  });

  test('should return object with category, priority, sentiment', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: '{"category": "complaint", "priority": "high", "sentiment": "negative"}',
          },
        },
      ],
    });

    const result = await categorizeEmail(
      'Air conditioning broken!',
      'The AC in room 302 is not working. This is urgent!'
    );

    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('priority');
    expect(result).toHaveProperty('sentiment');
    expect(result.category).toBe('complaint');
    expect(result.priority).toBe('high');
    expect(result.sentiment).toBe('negative');
  });

  test('should parse valid JSON from OpenAI', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: '{"category": "booking", "priority": "medium", "sentiment": "positive"}',
          },
        },
      ],
    });

    const result = await categorizeEmail('Book room', 'I want to reserve a room');
    expect(result.category).toBe('booking');
  });

  test('should return safe defaults on API error', async () => {
    mockCreate.mockRejectedValue(new Error('API key invalid'));

    const result = await categorizeEmail('Test', 'Test body');

    expect(result.category).toBe('other');
    expect(result.priority).toBe('medium');
    expect(result.sentiment).toBe('neutral');
  });

  test('should handle malformed JSON with fallback', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'This is not JSON',
          },
        },
      ],
    });

    const result = await categorizeEmail('Test', 'Test body');

    expect(result.category).toBe('other');
    expect(result.priority).toBe('medium');
    expect(result.sentiment).toBe('neutral');
  });

  test('should be called with subject and body', async () => {
    await categorizeEmail('Test subject', 'Test body');
    expect(mockCreate).toHaveBeenCalled();
  });
});
