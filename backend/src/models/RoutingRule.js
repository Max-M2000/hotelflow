const mongoose = require('mongoose');

const routingRuleSchema = new mongoose.Schema(
  {
    // Match criteria
    category: { type: String, required: true }, // inquiry, complaint, booking, other
    priority: { type: String, enum: ['low', 'medium', 'high'] }, // optional filter
    sentiment: { type: String }, // optional: positive, neutral, negative

    // Action - who to assign to
    assignTo: { type: String, required: true }, // Team name or staff member
    rulePriority: { type: String, enum: ['low', 'medium', 'high'] }, // Set priority on matched tickets

    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const RoutingRule = mongoose.model('RoutingRule', routingRuleSchema);

module.exports = RoutingRule;
