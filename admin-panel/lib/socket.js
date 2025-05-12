// /lib/socket.js
import io from 'socket.io-client';


const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://192.168.8.141:5000';

// ✅ Attach socket to globalThis so it persists across reloads
if (!globalThis._socket) {
  globalThis._socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'],
  });

  globalThis._socket.on('connect_error', (err) => {
    console.error('🔌 Socket.IO connection error:', err.message);
  });
}

export const getSocket = () => globalThis._socket;

export const connectSocket = () => {
  const socket = getSocket();
  if (!socket.connected && socket.disconnected) {
    socket.connect();
  }
};
