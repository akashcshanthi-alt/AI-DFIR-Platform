const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Ensure environment variables are loaded if connectDB is invoked independently
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Connect to MongoDB database.
 * Connects to the local MongoDB Community Server.
 * If local MongoDB is unavailable, displays a clear, actionable error and aborts startup.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arclight_dfir';
  const sanitizedUri = mongoUri.replace(/\/\/[^@]+@/, '//***:***@');
  
  try {
    console.log(`[Database] Attempting connection to MongoDB at [${sanitizedUri}]...`);
    // Connect with a short timeout to fail fast if port is closed/refused
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[Database] Connected to MongoDB database successfully: "${mongoose.connection.name}" at ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (error) {
    console.error(`\n======================================================================`);
    console.error(`[Database Error] Critical: Unable to connect to MongoDB server.`);
    console.error(`Target URI: ${sanitizedUri}`);
    console.error(`Failure Detail: ${error.message}`);
    console.error(`\nActionable Steps to Resolve:`);
    console.error(`  1. Verify that MongoDB Community Server is installed and running locally.`);
    console.error(`     - Windows Service: Run 'Get-Service MongoDB' in PowerShell.`);
    console.error(`     - To start service: Run 'Start-Service MongoDB' in Administrator PowerShell.`);
    console.error(`     - Manual CLI: Run 'mongod --dbpath <path_to_data_folder>'`);
    console.error(`  2. Ensure port 27017 is listening on 127.0.0.1:`);
    console.error(`     - Test: 'Test-NetConnection -ComputerName 127.0.0.1 -Port 27017'`);
    console.error(`  3. Verify MONGO_URI in 'server/.env':`);
    console.error(`     - Expected format: mongodb://127.0.0.1:27017/arclight_dfir`);
    console.error(`======================================================================\n`);
    throw error;
  }
};

module.exports = connectDB;
