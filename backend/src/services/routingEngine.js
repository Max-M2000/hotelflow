const RoutingRule = require('../models/RoutingRule');

/**
 * Find appropriate team/staff for ticket based on rules
 * @param {String} category - Ticket category (inquiry, complaint, booking, other)
 * @param {String} priority - Ticket priority (low, medium, high)
 * @param {String} sentiment - Ticket sentiment (positive, neutral, negative)
 * @returns {String} Team/staff name to assign to
 */
// A rule is "more specific" the more optional filters it sets. A priority/
// sentiment exception should win over the category's base rule.
const specificity = (rule) =>
  (rule.priority ? 1 : 0) + (rule.sentiment ? 1 : 0);

const routeTicket = async (category, priority, sentiment) => {
  try {
    // Load all active rules
    const rules = await RoutingRule.find({ active: true });

    // Collect every rule that matches (category is required; priority/sentiment
    // filters only need to match when they are set on the rule).
    const candidates = rules.filter(rule => {
      const categoryMatches = rule.category === category;
      const priorityMatches = !rule.priority || rule.priority === priority;
      const sentimentMatches = !rule.sentiment || rule.sentiment === sentiment;

      return categoryMatches && priorityMatches && sentimentMatches;
    });

    // Most specific rule wins (e.g. "complaint + high → Management" beats
    // the base "complaint → Reception").
    candidates.sort((a, b) => specificity(b) - specificity(a));

    return candidates[0] ? candidates[0].assignTo : 'general-support';
  } catch (error) {
    console.error('Routing failed:', error.message);
    // Fallback to default if routing service fails
    return 'general-support';
  }
};

module.exports = { routeTicket };
