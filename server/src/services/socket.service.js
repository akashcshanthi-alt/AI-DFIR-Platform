const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for testing
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // JWT auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-12345', (err, decoded) => {
        if (err) {
          console.warn('[Socket] Connection authentication failed:', err.message);
          return next(new Error('Authentication error'));
        }
        socket.user = decoded;
        next();
      });
    } else {
      console.warn('[Socket] Connection attempt without token');
      return next(new Error('Authentication error: Token missing'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Operator connected: ${socket.id} (User: ${socket.user?.email || 'Unknown'})`);

    const userId = socket.user?.id;
    if (userId) {
      socket.join(userId.toString());
      console.log(`[Socket] Socket ${socket.id} joined user room: ${userId}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] Operator disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

/**
 * Send real-time notification to targeted user or broadcast to all
 */
const sendNotification = (userId, notification) => {
  if (!io) {
    console.warn('[Socket] Cannot send notification, socket server not initialized.');
    return;
  }

  // Format standard notification payload for the frontend
  const payload = {
    _id: notification._id,
    notificationId: notification.notificationId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    userId: notification.userId,
    isRead: notification.isRead,
    createdAt: notification.createdAt
  };

  if (userId) {
    // Target specific user
    io.to(userId.toString()).emit('notification', payload);
    console.log(`[Socket] Dispatched real-time notification to user ${userId}: ${notification.title}`);
  } else {
    // Broadcast globally
    io.emit('notification', payload);
    console.log(`[Socket] Broadcasted real-time notification globally: ${notification.title}`);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  sendNotification
};
