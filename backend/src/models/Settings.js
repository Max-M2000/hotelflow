const mongoose = require('mongoose');

// Singleton settings for the hotel (single-tenant for now; add hotelId later
// for multi-tenancy). Holds the reply signature and reusable reply templates
// that staff can insert when answering guests.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true }, // singleton marker
    signature: {
      type: String,
      default:
        'Bei weiteren Fragen stehen wir Ihnen jederzeit gern zur Verfügung.\n\nHerzliche Grüße\nIhr Team',
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

// Find the singleton, creating it (with defaults) on first access.
settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ key: 'default' });
  if (!doc) {
    doc = await this.create({ key: 'default', templates: this.DEFAULT_TEMPLATES });
  }
  return doc;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
