const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

describe('Ticket Model', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/hotelflow-test'
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Ticket.deleteMany({});
  });

  test('should create a ticket with required fields', async () => {
    const ticketData = {
      emailId: 'email-123',
      guestEmail: 'guest@example.com',
      guestName: 'John Doe',
      subject: 'Room temperature issue',
      body: 'The AC is not working',
    };

    const ticket = await Ticket.create(ticketData);

    expect(ticket._id).toBeDefined();
    expect(ticket.emailId).toBe('email-123');
    expect(ticket.status).toBe('open');
    expect(ticket.category).toBe('inquiry');
    expect(ticket.priority).toBe('medium');
  });

  test('should fail without required fields', async () => {
    const incompleteData = {
      guestEmail: 'guest@example.com',
      // Missing emailId, guestName, subject, body
    };

    await expect(Ticket.create(incompleteData)).rejects.toThrow();
  });
});
