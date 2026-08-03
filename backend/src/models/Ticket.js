const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    // Tenant this ticket belongs to. Every query MUST be scoped by hotelId.
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    emailId: { type: String, required: true },
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
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    assignedTo: { type: String, default: null },
    notes: [
      {
        author: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    replies: [
      {
        author: String,
        to: String,
        subject: String,
        body: String,
        messageId: String,
        sentAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Deduplicate inbound emails per tenant: the same emailId may in theory appear
// for two different hotels, but never twice within one hotel.
ticketSchema.index({ hotelId: 1, emailId: 1 }, { unique: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
