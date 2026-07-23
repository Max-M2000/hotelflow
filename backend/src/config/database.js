const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try to connect to production MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Atlas connected');
  } catch (error) {
    // Fallback: Use in-memory MongoDB for local development
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠ MongoDB Atlas unavailable, using in-memory database for development');
      console.log('  → Tip: Set MONGODB_URI and whitelist your IP in MongoDB Atlas for production');

      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri);
        console.log('✓ In-Memory MongoDB (development) connected');

        // Store reference for cleanup if needed
        global.mongoServer = mongoServer;
      } catch (memoryError) {
        console.error('✗ Failed to start in-memory MongoDB:', memoryError.message);
        process.exit(1);
      }
    } else {
      console.error('✗ MongoDB connection failed (production):', error.message);
      process.exit(1);
    }
  }
};

module.exports = { connectDB };
