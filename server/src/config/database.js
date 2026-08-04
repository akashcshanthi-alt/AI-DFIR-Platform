const mongoose = require('mongoose');

/**
 * Connect to MongoDB database.
 * If the configured MONGO_URI is unavailable, spins up and connects to an in-memory MongoDB instance.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/arclight_dfir';
  
  try {
    console.log(`[Database] Attempting database connection to [${mongoUri}]...`);
    // Connect with a short timeout to fail fast if port is closed/refused
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('[Database] Connected to MongoDB database successfully.');
  } catch (error) {
    console.warn(`[Database] Connection refused on [${mongoUri}]: ${error.message}`);
    console.log('[Database] Activating fallback. Starting in-memory MongoDB instance...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      
      console.log(`[Database] Connecting to in-memory instance [${inMemoryUri}]...`);
      await mongoose.connect(inMemoryUri);
      console.log('[Database] Connected to in-memory MongoDB database successfully.');
    } catch (fallbackError) {
      console.error(`[Database] Fatal: Database connection could not be established: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
