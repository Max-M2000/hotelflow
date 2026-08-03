/**
 * One-time migration: single-tenant → multi-tenant.
 *
 * Wraps all EXISTING data (users, tickets, settings, routing rules) into one
 * initial Hotel so nothing is left orphaned after the multi-tenancy rollout.
 *
 *   HOTEL_NAME=...            name for the existing hotel (default "Mein Hotel")
 *   INBOUND_FORWARD_ADDRESS=  the hotel's current Ospitara/CloudMailin address
 *                             (so inbound email keeps routing to it)
 *
 * Idempotent: if a Hotel already exists it refuses to run again (unless the
 * only thing missing is hotelId on some docs, which it then backfills to the
 * first hotel).
 *
 * Usage (Railway one-off):  node src/scripts/migrateToMultiTenant.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const RoutingRule = require('../models/RoutingRule');
const Settings = require('../models/Settings');

async function run() {
  await connectDB();

  // 1) Get or create the initial hotel.
  let hotel = await Hotel.findOne().sort({ createdAt: 1 });
  if (hotel) {
    console.log(`ℹ Existing hotel found: "${hotel.name}" (${hotel._id}). Backfilling any orphaned docs to it.`);
  } else {
    const name = process.env.HOTEL_NAME || 'Mein Hotel';
    const inbound = (process.env.INBOUND_FORWARD_ADDRESS || '').toLowerCase().trim();
    hotel = await Hotel.create({
      name,
      inboundAddresses: inbound ? [inbound] : [],
      status: 'active',
    });
    console.log(`✓ Created hotel "${name}" (${hotel._id})`);
    if (inbound) console.log(`  inbound address: ${inbound}`);
    else console.log('  ⚠ No INBOUND_FORWARD_ADDRESS set — set inboundAddresses manually before inbound email will route.');
  }

  const hotelId = hotel._id;

  // 2) Backfill hotelId on every collection (only docs that lack it).
  const u = await User.updateMany({ hotelId: { $exists: false } }, { $set: { hotelId } });
  const t = await Ticket.updateMany({ hotelId: { $exists: false } }, { $set: { hotelId } });
  const r = await RoutingRule.updateMany({ hotelId: { $exists: false } }, { $set: { hotelId } });

  // Settings: the old global singleton used { key: 'default' } and had no
  // hotelId. Attach it to the hotel. NOTE: the obsolete `key` field must be
  // removed via the native driver — a Mongoose $unset is silently dropped
  // because `key` is no longer in the schema (strict mode).
  const s = await Settings.updateMany(
    { hotelId: { $exists: false } },
    { $set: { hotelId } }
  );
  await mongoose.connection.db
    .collection('settings')
    .updateMany({ key: { $exists: true } }, { $unset: { key: '' } });

  console.log('✓ Backfill complete:');
  console.log(`  users:         ${u.modifiedCount}`);
  console.log(`  tickets:       ${t.modifiedCount}`);
  console.log(`  routing rules: ${r.modifiedCount}`);
  console.log(`  settings:      ${s.modifiedCount}`);

  // Drop stale single-tenant unique indexes that would break multi-tenancy:
  //  - settings.key_1     → new tenants have no `key`; a 2nd null collides.
  //  - tickets.emailId_1  → same Message-ID across two hotels would collide
  //                          globally; dedup is now per-hotel {hotelId,emailId}.
  const dropIndex = async (coll, name) => {
    try {
      await mongoose.connection.db.collection(coll).dropIndex(name);
      console.log(`✓ Dropped stale index ${coll}.${name}`);
    } catch (e) {
      if (e.codeName !== 'IndexNotFound') console.log(`• ${coll}.${name}: ${e.codeName || e.message}`);
    }
  };
  await dropIndex('settings', 'key_1');
  await dropIndex('tickets', 'emailId_1');

  await mongoose.connection.close();
  console.log('✓ Migration done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('✖ Migration failed:', err.message);
  process.exit(1);
});
