const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
});

// Connect to DB in background
connectDB().catch(err => {
  console.error('⚠ Database connection failed:', err.message);
});

module.exports = app;
