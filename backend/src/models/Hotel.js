const mongoose = require('mongoose');

/**
 * A Hotel is a tenant: its own isolated workspace. Every User, Ticket,
 * Settings doc and RoutingRule belongs to exactly one Hotel via `hotelId`.
 * The hotel's manager is the admin of this workspace; the platform operator
 * is NOT a member and does not appear in the hotel's user list.
 */
const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Optional contact/address, filled during onboarding.
    address: { type: String, default: '' },
    contactEmail: { type: String, default: '', lowercase: true, trim: true },

    // Inbound routing: the forwarding/Ospitara address(es) that deliver a
    // guest email into THIS hotel's workspace. The inbound webhook maps the
    // recipient address of an incoming mail to a hotel via this list.
    // Stored lowercased; each address routes to exactly one hotel.
    inboundAddresses: {
      type: [{ type: String, lowercase: true, trim: true }],
      default: [],
      index: true,
    },

    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

hotelSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

/**
 * Resolve the hotel that owns a given inbound recipient address.
 * Returns null when no hotel claims that address (caller decides what to do).
 */
hotelSchema.statics.findByInboundAddress = function findByInboundAddress(address) {
  if (!address) return null;
  return this.findOne({
    inboundAddresses: String(address).toLowerCase().trim(),
    status: 'active',
  });
};

module.exports = mongoose.model('Hotel', hotelSchema);
