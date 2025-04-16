import { io } from 'socket.io-client';

let socket = null;
let isConnecting = false;

const SOCKET_URL = "http://192.168.8.141:5000"; // ✅ Change to 10.0.2.2 if using Android emulator

export default {
  connect: () => {
    if (socket && socket.connected) {
      return socket;
    }

    if (isConnecting) {
      console.log("⏳ Socket connection already in progress");
      return socket;
    }

    isConnecting = true;
    console.log('🌐 Connecting to socket server...');

    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'], // ✅ fallback added
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      isConnecting = false;
    });

    socket.on('disconnect', (reason) => {
      console.warn(`⚠️ Socket disconnected: ${reason}`);
    });

    socket.on('connect_error', (err) => {
      console.error("❌ Socket connect error:", err.message);
      isConnecting = false;
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      isConnecting = false;
    }
  },

  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  },

  off: (event) => {
    if (socket && socket.off) {
      socket.off(event);
    }
  },

  emit: (event, payload) => {
    if (socket) {
      socket.emit(event, payload);
    }
  },

  testConnection: () => {
    const testSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      timeout: 5000
    });

    testSocket.on('connect', () => {
      console.log('✅ Test connection successful!');
      testSocket.disconnect();
    });

    testSocket.on('connect_error', (err) => {
      console.error("❌ Test connection failed:", err.message);
    });

    return testSocket;
  }
};
