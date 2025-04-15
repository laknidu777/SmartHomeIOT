import { io } from 'socket.io-client';

let socket;
let connectionAttempts = 0;

export default {
  connect: () => {
    if (!socket || !socket.connected) {
      // Prevent multiple connection attempts in quick succession
      if (connectionAttempts > 0) {
        console.log(`Preventing duplicate connection, attempt ${connectionAttempts}`);
        connectionAttempts++;
        return socket;
      }
      
      connectionAttempts++;
      console.log('Connecting to socket server...');
      
      socket = io("http://192.168.8.141:5000", {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });
      
      // Reset connection attempts counter on successful connection
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        connectionAttempts = 0;
      });
      
      // Handle disconnect events
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
      });
    }
    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      connectionAttempts = 0;
    }
  },

  // Rest of your methods stay the same
  on: (event, callback) => {
    if (socket) socket.on(event, callback);
  },

  off: (event) => {
    if (socket) socket.off(event);
  },

  emit: (event, payload) => {
    if (socket) socket.emit(event, payload);
  },
};