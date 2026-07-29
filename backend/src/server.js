const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/database');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

// CORS: lock to an explicit allow-list from CORS_ORIGINS (comma-separated).
// Falls back to "*" only if unset, so local dev keeps working — set it in prod.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin: curl, server-to-server, webhooks).
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true); // dev fallback
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

// Start server immediately (don't wait for DB)
app.listen(PORT, () => {
  console.log(`✓ HotelFlow backend running on port ${PORT}`);
  console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`MONGODB_URI set: ${process.env.MONGODB_URI ? 'YES' : 'NO'}`);
  console.log(`OPENAI_API_KEY set: ${process.env.OPENAI_API_KEY ? 'YES' : 'NO'}`);
  console.log(`JWT_SECRET set: ${process.env.JWT_SECRET ? 'YES' : 'NO — auth WILL fail'}`);
  console.log(`INBOUND_WEBHOOK_SECRET set: ${process.env.INBOUND_WEBHOOK_SECRET ? 'YES' : 'NO — webhook will 503'}`);
  console.log(`CORS_ORIGINS: ${allowedOrigins.length ? allowedOrigins.join(', ') : '(open — dev fallback)'}`);
  console.log(`AWS_ACCESS_KEY_ID set: ${process.env.AWS_ACCESS_KEY_ID ? 'YES' : 'NO'}`);
  console.log(`AWS_REGION set: ${process.env.AWS_REGION ? 'YES (' + process.env.AWS_REGION + ')' : 'NO (default eu-central-1)'}`);
  console.log(`RESEND_API_KEY set: ${process.env.RESEND_API_KEY ? 'YES' : 'NO'}`);
  console.log(`MAIL_FROM set: ${process.env.MAIL_FROM ? 'YES (' + process.env.MAIL_FROM + ')' : 'NO'}`);
  console.log(`SMTP_HOST set: ${process.env.SMTP_HOST ? 'YES (' + process.env.SMTP_HOST + ')' : 'NO'}`);
});

// Connect to DB in background
connectDB().catch(err => {
  console.error('⚠ Database connection failed:', err.message);
});

module.exports = app;
