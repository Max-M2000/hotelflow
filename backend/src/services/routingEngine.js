const RoutingRule = require('../models/RoutingRule');

/**
 * Find appropriate team/staff for ticket based on rules
 * @param {String} category - Ticket category (inquiry, complaint, booking, other)
 * @param {String} priority - Ticket priority (low, medium, high)
 * @param {String} sentiment - Ticket sentiment (positive, neutral, negative)
 * @returns {String} Team/staff name to assign to
 */
const routeTicket = async (category, priority, sentiment) => {
  try {
    // Load all active rules
    const rules = await RoutingRule.find({ active: true });

    // Find matching rule (category match is required)
    const matchedRule = rules.find(rule => {
      const categoryMatches = rule.category === category;
      const priorityMatches = !rule.priority || rule.priority === priority;
      const sentimentMatches = !rule.sentiment || rule.sentiment === sentiment;

      return categoryMatches && priorityMatches && sentimentMatches;
    });

    // Return assigned team or default
    return matchedRule ? matchedRule.assignTo : 'general-support';
  } catch (error) {
    console.error('Routing failed:', error.message);
    // Fallback to default if routing service fails
    return 'general-support';
  }
};

module.exports = { routeTicket };
