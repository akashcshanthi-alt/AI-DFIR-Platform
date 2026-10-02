const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const { initializeSocket } = require('./services/socket.service');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Fail closed in production if required cryptographic secrets are not set
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        throw new Error('Critical Security Failure: JWT_SECRET and JWT_REFRESH_SECRET must be configured in production.');
      }
    }

    // Invoke configuration setup (connecting Mongo is deferred)
    await connectDB();
    const seedDatabase = require('./utils/seeder');
    await seedDatabase();
    initializeFirebase();

    const server = http.createServer(app);
    initializeSocket(server);

    server.listen(PORT, () => {
      console.log(`[TRACE AI Server] Listening successfully on port ${PORT} in [${process.env.NODE_ENV || 'development'}] mode.`);
    });
  } catch (error) {
    console.error(`[TRACE AI Server] Initialization failure: ${error.message}`);
    process.exit(1);
  }
};

startServer();
