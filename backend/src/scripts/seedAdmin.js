/**
 * Bootstrap / update the admin account from env vars.
 *
 *   ADMIN_EMAIL=...   ADMIN_PASSWORD=...   [ADMIN_NAME=...]
 *
 * Idempotent: run it again with a new ADMIN_PASSWORD to rotate the password.
 * Usage (locally or as a Railway one-off):  node src/scripts/seedAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const User = require('../models/User');
const Hotel = require('../models/Hotel');

async function run() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'Admin';
  const wantedHotelId = (process.env.ADMIN_HOTEL_ID || '').trim();

  if (!email || !password) {
    console.error('✖ ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('✖ ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  // Every user must belong to a hotel. Resolve which one:
  //  - ADMIN_HOTEL_ID if given, else
  //  - the only hotel if exactly one exists, else refuse (ambiguous).
  let hotelId = wantedHotelId;
  if (!hotelId) {
    const hotels = await Hotel.find().select('_id name').limit(2);
    if (hotels.length === 1) {
      hotelId = String(hotels[0]._id);
      console.log(`ℹ Using the only hotel: "${hotels[0].name}" (${hotelId})`);
    } else if (hotels.length === 0) {
      console.error('✖ No hotel exists yet. Run seedHotel.js (or migrateToMultiTenant.js) first.');
      process.exit(1);
    } else {
      console.error('✖ Multiple hotels exist. Set ADMIN_HOTEL_ID to pick one.');
      process.exit(1);
    }
  }

  const passwordHash = await User.hashPassword(password);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.active = true;
    if (!existing.hotelId) existing.hotelId = hotelId;
    if (name) existing.name = name;
    await existing.save();
    console.log(`✓ Updated admin: ${email}`);
  } else {
    await User.create({ hotelId, email, passwordHash, name, role: 'admin', active: true });
    console.log(`✓ Created admin: ${email}`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('✖ Seed failed:', err.message);
  process.exit(1);
});
