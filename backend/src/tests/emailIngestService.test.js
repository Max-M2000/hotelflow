const { processIncomingEmail } = require('../services/emailIngestService');
const Ticket = require('../models/Ticket');
const { categorizeEmail } = require('../services/categorizer');
const { routeTicket } = require('../services/routingEngine');
const { extractGuestName } = require('../services/emailParser');

// Mock all dependencies
jest.mock('../models/Ticket');
jest.mock('../services/categorizer');
jest.mock('../services/routingEngine');
jest.mock('../services/emailParser');

describe('Email Ingest Service - Full Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process complaint email end-to-end', async () => {
    // Mock responses
    categorizeEmail.mockResolvedValue({
      category: 'complaint',
      priority: 'high',
      sentiment: 'negative',
    });

    routeTicket.mockResolvedValue('management');

    extractGuestName.mockReturnValue('John Doe');

    const mockTicket = {
      _id: '507f1f77bcf86cd799439011',
      emailId: 'test-001',
      guestEmail: 'john@example.com',
      guestName: 'John Doe',
      subject: 'Room is too cold',
      body: 'AC broken, please fix ASAP',
      category: 'complaint',
      priority: 'high',
      sentiment: 'negative',
      assignedTo: 'management',
      status: 'open',
      notes: [],
    };

    Ticket.create.mockResolvedValue(mockTicket);

    // Test the full pipeline
    const result = await processIncomingEmail({
      emailId: 'test-001',
      from: 'john@example.com',
      subject: 'Room is too cold',
      body: 'AC broken, please fix ASAP',
    });

    // Verify all steps were called
    expect(categorizeEmail).toHaveBeenCalledWith('Room is too cold', 'AC broken, please fix ASAP');
    expect(routeTicket).toHaveBeenCalledWith('complaint', 'high', 'negative');
    expect(extractGuestName).toHaveBeenCalledWith('john@example.com');
    expect(Ticket.create).toHaveBeenCalled();

    // Verify result
    expect(result).toEqual(mockTicket);
    expect(result.category).toBe('complaint');
    expect(result.assignedTo).toBe('management');
  });

  test('should process booking inquiry end-to-end', async () => {
    categorizeEmail.mockResolvedValue({
      category: 'booking',
      priority: 'medium',
      sentiment: 'positive',
    });

    routeTicket.mockResolvedValue('reservations');
    extractGuestName.mockReturnValue('Jane Smith');

    const mockTicket = {
      _id: '507f1f77bcf86cd799439012',
      emailId: 'test-002',
      guestEmail: 'jane@example.com',
      guestName: 'Jane Smith',
      subject: 'Book deluxe room',
      body: 'I want to book a room for next week',
      category: 'booking',
      priority: 'medium',
      sentiment: 'positive',
      assignedTo: 'reservations',
      status: 'open',
      notes: [],
    };

    Ticket.create.mockResolvedValue(mockTicket);

    const result = await processIncomingEmail({
      emailId: 'test-002',
      from: 'jane@example.com',
      subject: 'Book deluxe room',
      body: 'I want to book a room for next week',
    });

    expect(result.category).toBe('booking');
    expect(result.assignedTo).toBe('reservations');
    expect(result.sentiment).toBe('positive');
  });

  test('should process general inquiry with routing fallback', async () => {
    categorizeEmail.mockResolvedValue({
      category: 'inquiry',
      priority: 'low',
      sentiment: 'neutral',
    });

    routeTicket.mockResolvedValue('general-support');
    extractGuestName.mockReturnValue('Bob Wilson');

    const mockTicket = {
      _id: '507f1f77bcf86cd799439013',
      emailId: 'test-003',
      guestEmail: 'bob@example.com',
      guestName: 'Bob Wilson',
      subject: 'WiFi password?',
      body: 'What is the WiFi password?',
      category: 'inquiry',
      priority: 'low',
      sentiment: 'neutral',
      assignedTo: 'general-support',
      status: 'open',
      notes: [],
    };

    Ticket.create.mockResolvedValue(mockTicket);

    const result = await processIncomingEmail({
      emailId: 'test-003',
      from: 'bob@example.com',
      subject: 'WiFi password?',
      body: 'What is the WiFi password?',
    });

    expect(result.category).toBe('inquiry');
    expect(result.assignedTo).toBe('general-support');
  });

  test('should propagate categorizer errors (critical step)', async () => {
    // Categorizer fails - this is critical, error should propagate
    categorizeEmail.mockRejectedValue(new Error('API error'));

    await expect(
      processIncomingEmail({
        emailId: 'test-004',
        from: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
      })
    ).rejects.toThrow('API error');

    // Verify categorizer was called
    expect(categorizeEmail).toHaveBeenCalled();
  });

  test('should include all required fields in created ticket', async () => {
    categorizeEmail.mockResolvedValue({
      category: 'complaint',
      priority: 'high',
      sentiment: 'negative',
    });

    routeTicket.mockResolvedValue('management');
    extractGuestName.mockReturnValue('Test Guest');

    Ticket.create.mockResolvedValue({
      _id: 'test-id',
      emailId: 'email-123',
      guestEmail: 'test@example.com',
      guestName: 'Test Guest',
      subject: 'Test subject',
      body: 'Test body',
      category: 'complaint',
      priority: 'high',
      sentiment: 'negative',
      assignedTo: 'management',
      status: 'open',
      notes: [],
    });

    await processIncomingEmail({
      emailId: 'email-123',
      from: 'test@example.com',
      subject: 'Test subject',
      body: 'Test body',
    });

    // Verify Ticket.create was called with proper data
    const createCall = Ticket.create.mock.calls[0][0];
    expect(createCall).toHaveProperty('emailId');
    expect(createCall).toHaveProperty('guestEmail');
    expect(createCall).toHaveProperty('guestName');
    expect(createCall).toHaveProperty('subject');
    expect(createCall).toHaveProperty('body');
    expect(createCall).toHaveProperty('category');
    expect(createCall).toHaveProperty('priority');
    expect(createCall).toHaveProperty('sentiment');
    expect(createCall).toHaveProperty('assignedTo');
    expect(createCall).toHaveProperty('status', 'open');
  });
});
