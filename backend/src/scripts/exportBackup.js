/**
 * Read-only safety backup: dumps every collection of the connected MongoDB
 * database into timestamped JSON files. Touches nothing in the DB — pure export.
 *
 * Runs against process.env.MONGODB_URI (inject it via `railway run` or set it).
 * Output: ./backups/<db>-<timestamp>/<collection>.json
 *
 * Usage:  railway run node src/scripts/exportBackup.js
 *     or  MONGODB_URI="mongodb+srv://..." node src/scripts/exportBackup.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✖ MONGODB_URI is not set. Run via `railway run` or set it explicitly.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection;
  console.log(`✓ Connected to DB "${db.name}"`);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(process.cwd(), 'backups', `${db.name}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const collections = await db.db.listCollections().toArray();
  if (collections.length === 0) {
    console.warn('⚠ No collections found — database appears empty.');
  }

  let total = 0;
  for (const { name } of collections) {
    const docs = await db.db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(docs, null, 2));
    console.log(`  ✓ ${name}: ${docs.length} Dokument(e)`);
    total += docs.length;
  }

  console.log(`\n✓ Backup fertig: ${collections.length} Collection(s), ${total} Dokument(e) gesamt.`);
  console.log(`  Ordner: ${outDir}`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('✖ Backup fehlgeschlagen:', err.message);
  process.exit(1);
});
