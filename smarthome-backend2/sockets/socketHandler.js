import { deviceSockets, hubSockets } from './socketRegistry.js';

export const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('registerDevice', ({ espId, secretKey }) => {
      // TODO: Validate secretKey
      deviceSockets[espId] = socket;
      console.log(`✅ Device registered: ${espId}`);
    });

    socket.on('registerHub', ({ hubId, secretKey }) => {
      // TODO: Validate secretKey
      hubSockets[hubId] = socket;
      console.log(`✅ Hub registered: ${hubId}`);
    });

    socket.on('heartbeat', ({ espId }) => {
    console.log(`❤️ Heartbeat received from: ${espId}`);
    // Optional: update device's isOnline status
    });


    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);

      for (const [espId, sock] of Object.entries(deviceSockets)) {
        if (sock.id === socket.id) delete deviceSockets[espId];
      }

      for (const [hubId, sock] of Object.entries(hubSockets)) {
        if (sock.id === socket.id) delete hubSockets[hubId];
      }
    });
  });
};
