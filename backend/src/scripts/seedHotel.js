/**
 * Provision a NEW hotel (tenant) with its own manager-admin.
 *
 * This is the Phase-1 onboarding tool: the platform operator runs it once to
 * hand a hotel its own isolated workspace and an admin login for the manager.
 * The operator is NOT added to the hotel — the manager owns and runs it.
 *
 *   HOTEL_NAME=...        required, e.g. "Hotel Art Nouveau"
 *   HOTEL_INBOUND=...     the hotel's Ospitara/CloudMailin forwarding address
 *   ADMIN_EMAIL=...       required, the manager's login email
 *   ADMIN_PASSWORD=...    required, min 8 chars (manager changes it after first login)
 *   ADMIN_NAME=...        optional, the manager's name
 *   HOTEL_ADDRESS=...     optional
 *
 * Usage (Railway one-off):  node src/scripts/seedHotel.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Settings = require('../models/Settings');
const RoutingRule = require('../models/RoutingRule');

async function run() {
  const name = (process.env.HOTEL_NAME || '').trim();
  const inbound = (process.env.HOTEL_INBOUND || '').toLowerCase().trim();
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  const adminName = (process.env.ADMIN_NAME || 'Manager').trim();
  const address = (process.env.HOTEL_ADDRESS || '').trim();

  if (!name) return fail('HOTEL_NAME is required.');
  if (!email || !password) return fail('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  if (password.length < 8) return fail('ADMIN_PASSWORD must be at least 8 characters.');

  await connectDB();

  // Guard: don't collide with an existing account.
  const clash = await User.findOne({ email });
  if (clash) return fail(`A user with email ${email} already exists.`);

  // Guard: an inbound address must map to exactly one hotel.
  if (inbound) {
    const addrClash = await Hotel.findOne({ inboundAddresses: inbound });
    if (addrClash) return fail(`Inbound address ${inbound} is already used by hotel ${addrClash._id}.`);
  }

  // 1) Hotel
  const hotel = await Hotel.create({
    name,
    address,
    inboundAddresses: inbound ? [inbound] : [],
    status: 'active',
  });
  console.log(`✓ Hotel "${name}" created (${hotel._id})`);
  if (inbound) console.log(`  inbound: ${inbound}`);
  else console.log('  ⚠ No HOTEL_INBOUND set — add an inbound address before guest email will route.');

  // 2) Manager admin
  const passwordHash = await User.hashPassword(password);
  const admin = await User.create({
    hotelId: hotel._id,
    email,
    passwordHash,
    name: adminName,
    role: 'admin',
    active: true,
  });
  console.log(`✓ Admin "${email}" created (${admin._id})`);

  // 3) Starter settings (default templates) + default routing rules
  await Settings.getForHotel(hotel._id);
  const defaults = [
    { category: 'complaint', assignTo: 'Management' },
    { category: 'booking', assignTo: 'Reservierung' },
    { category: 'inquiry', assignTo: 'Rezeption' },
    { category: 'other', assignTo: 'Rezeption' },
  ].map((d) => ({ ...d, hotelId: hotel._id }));
  await RoutingRule.insertMany(defaults);
  console.log('✓ Default templates + routing rules seeded.');

  await mongoose.connection.close();
  console.log('\n✓ Done. Manager can log in at app.ospitara.de and should change the password.');
  process.exit(0);
}

function fail(msg) {
  console.error('✖ ' + msg);
  process.exit(1);
}

run().catch((err) => {
  console.error('✖ Provisioning failed:', err.message);
  process.exit(1);
});
