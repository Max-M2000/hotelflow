const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    emailId: { type: String, required: true, unique: true },
    guestEmail: { type: String, required: true },
    guestName: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ['inquiry', 'complaint', 'booking', 'other'],
      default: 'inquiry',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'closed'],
      default: 'open',
    },
    assignedTo: { type: String, default: null },
    notes: [
      {
        author: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
