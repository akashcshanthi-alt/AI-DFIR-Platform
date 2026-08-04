import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const socketService = {
  connect() {
    if (socket && socket.connected) return socket;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[Socket] Cannot connect: Token is missing from storage.');
      return null;
    }

    socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to real-time notification server. ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from server. Reason:', reason);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log('[Socket] Disconnected and cleared socket instance.');
    }
  },

  getSocket() {
    return socket;
  },

  subscribeToNotifications(callback) {
    if (!socket) {
      this.connect();
    }
    if (socket) {
      socket.off('notification'); // Prevent duplicate listeners
      socket.on('notification', (data) => {
        console.log('[Socket] Received real-time notification:', data);
        callback(data);
      });
    }
  },

  unsubscribeFromNotifications() {
    if (socket) {
      socket.off('notification');
    }
  }
};
