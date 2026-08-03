const { routeTicket } = require('../services/routingEngine');
const RoutingRule = require('../models/RoutingRule');

jest.mock('../models/RoutingRule');

const HOTEL = '507f1f77bcf86cd799439011'; // dummy tenant id for scoped calls

describe('Routing Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should route complaint to management', async () => {
    RoutingRule.find.mockResolvedValue([
      {
        category: 'complaint',
        priority: null,
        sentiment: null,
        assignTo: 'management',
      },
    ]);

    const result = await routeTicket('complaint', 'high', 'negative', HOTEL);
    expect(result).toBe('management');
  });

  test('should route inquiry to support', async () => {
    RoutingRule.find.mockResolvedValue([
      {
        category: 'inquiry',
        priority: null,
        sentiment: null,
        assignTo: 'support-team',
      },
    ]);

    const result = await routeTicket('inquiry', 'medium', 'neutral', HOTEL);
    expect(result).toBe('support-team');
  });

  test('should route booking to reservations', async () => {
    RoutingRule.find.mockResolvedValue([
      {
        category: 'booking',
        priority: null,
        sentiment: null,
        assignTo: 'reservations',
      },
    ]);

    const result = await routeTicket('booking', 'low', 'positive', HOTEL);
    expect(result).toBe('reservations');
  });

  test('should return default team when no rule matches', async () => {
    RoutingRule.find.mockResolvedValue([]);

    const result = await routeTicket('unknown', 'low', 'positive', HOTEL);
    expect(result).toBe('general-support');
  });

  test('should match rule with priority filter', async () => {
    RoutingRule.find.mockResolvedValue([
      {
        category: 'complaint',
        priority: 'high',
        sentiment: null,
        assignTo: 'escalation-team',
      },
    ]);

    // Should match: complaint + high priority
    const result = await routeTicket('complaint', 'high', 'negative', HOTEL);
    expect(result).toBe('escalation-team');
  });

  test('should not match if priority filter does not match', async () => {
    RoutingRule.find.mockResolvedValue([
      {
        category: 'complaint',
        priority: 'high',
        sentiment: null,
        assignTo: 'escalation-team',
      },
    ]);

    // Should NOT match: complaint + low priority (rule requires high)
    const result = await routeTicket('complaint', 'low', 'negative', HOTEL);
    expect(result).toBe('general-support');
  });

  test('should scope the rule query to the hotel', async () => {
    RoutingRule.find.mockResolvedValue([]);
    await routeTicket('inquiry', 'low', 'neutral', HOTEL);
    // Tenant isolation: the DB query must filter by hotelId.
    expect(RoutingRule.find).toHaveBeenCalledWith(
      expect.objectContaining({ hotelId: HOTEL, active: true })
    );
  });

  test('should return safe default when no hotelId is given', async () => {
    // A call without a tenant must never leak another hotel's rules.
    const result = await routeTicket('complaint', 'high', 'negative');
    expect(result).toBe('general-support');
    expect(RoutingRule.find).not.toHaveBeenCalled();
  });

  test('should handle routing service errors gracefully', async () => {
    RoutingRule.find.mockRejectedValue(new Error('Database error'));

    const result = await routeTicket('complaint', 'high', 'negative', HOTEL);
    // Should return safe default on error
    expect(result).toBe('general-support');
  });
});
