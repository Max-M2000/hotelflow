const mongoose = require('mongoose');

// Per-hotel settings (one document per tenant). Holds the reply signature and
// reusable reply templates that staff can insert when answering guests.
const settingsSchema = new mongoose.Schema(
  {
    // Tenant these settings belong to. One settings doc per hotel.
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      unique: true,
      index: true,
    },
    signature: {
      type: String,
      default:
        'Bei weiteren Fragen stehen wir Ihnen jederzeit gern zur Verfügung.\n\nHerzliche Grüße\nIhr Team',
    },
    // Free-text house facts the hotel maintains (check-in/out times, WLAN,
    // parking, breakfast, pet policy, ...). Fed into the AI reply drafter so it
    // answers with the hotel's real information instead of leaving placeholders.
    houseInfo: {
      type: String,
      default: '',
    },
    // Tonalität der KI-Antwortvorschläge (pro Hotel wählbar).
    replyStyle: {
      type: String,
      enum: ['formal', 'professional', 'casual'],
      default: 'professional',
    },
    // Freie Zusatz-Wünsche zum Stil (z. B. Länge, Grußformel, "keine Emojis").
    styleNotes: {
      type: String,
      default: '',
    },
    templates: [
      {
        label: { type: String, required: true },
        body: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Sensible starter templates so a new hotel isn't staring at an empty page.
// {name} is replaced with the guest's first name on insert.
settingsSchema.statics.DEFAULT_TEMPLATES = [
  { label: 'Begrüßung', body: 'Guten Tag {name},\n\nvielen Dank für Ihre Nachricht.\n\n' },
  { label: 'Check-in/-out', body: 'Unser Check-in ist ab 15:00 Uhr, der Check-out bis 11:00 Uhr möglich. Ein späterer Check-in ist nach Absprache jederzeit möglich – unsere Rezeption ist rund um die Uhr besetzt.\n\n' },
  { label: 'Parkplatz', body: 'Direkt am Hotel stehen Ihnen kostenfreie Parkplätze zur Verfügung, eine Reservierung ist nicht erforderlich.\n\n' },
  { label: 'WLAN', body: 'In allen Zimmern und öffentlichen Bereichen steht Ihnen kostenfreies WLAN zur Verfügung.\n\n' },
];

// Find a hotel's settings, creating them (with default templates) on first access.
settingsSchema.statics.getForHotel = async function (hotelId) {
  if (!hotelId) throw new Error('getForHotel requires a hotelId');
  let doc = await this.findOne({ hotelId });
  if (!doc) {
    doc = await this.create({ hotelId, templates: this.DEFAULT_TEMPLATES });
  }
  return doc;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
