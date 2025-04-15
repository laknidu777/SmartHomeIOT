import db from '../models/index.js';
const Device = db.Device;
const deviceSockets = new Map();

export const registerDeviceSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id,'from', socket.handshake.address);

    socket.on('registerDevice', (data) => {
        let espId = null;
    
        try {
          if (typeof data === 'object' && data.espId) {
            espId = data.espId;
          } else if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            espId = parsed.espId;
          }
        
          if (!espId) throw new Error('espId not found in payload');
        
          console.log(`📲 Device registered: ${espId}`);
          
          // Check if this device was already registered with a different socket
          const existingSocket = deviceSockets.get(espId);
          if (existingSocket && existingSocket.id !== socket.id) {
            console.log(`🔄 Device ${espId} reconnected with new socket. Old: ${existingSocket.id}, New: ${socket.id}`);
            
            // Clean up the old socket's heartbeat timeout
            if (existingSocket.heartbeatTimeout) {
              clearTimeout(existingSocket.heartbeatTimeout);
            }
            
            // Optional: force disconnect the old socket if it's somehow still connected
            if (existingSocket.connected) {
              existingSocket.disconnect(true);
            }
          }
          
          // Now register the new socket
          deviceSockets.set(espId, socket);
          socket.espId = espId;
          
          // Reset device status in database
          Device.update({ isOnline: true }, { where: { espId } })
          .then(() => {
            io.emit("deviceStatusChange", { espId, isOnline: true });
          })
          .catch(err => console.error(`Failed to update device status: ${err.message}`));    
        } catch (err) {
          console.error(`❌ Failed to register device: ${err.message}`);
        }        
    });

    socket.on('commandDevice', ({ espId, command }) => {
      const targetSocket = deviceSockets.get(espId);
      if (targetSocket) {
        console.log(`📤 Sending command to ${espId}: ${command}`);
        targetSocket.emit('deviceCommand', command);
      } else {
        console.warn(`🚫 Cannot send command, ${espId} not connected`);
        console.log('🧩 Currently connected devices:', [...deviceSockets.keys()]);
      }
    });
    socket.on('heartbeat', async (data) => {
        try {
          const espId = typeof data === 'string'
            ? JSON.parse(data).espId
            : data.espId;
      
          if (!espId) throw new Error('Missing espId');
      
          console.log(`❤️ Heartbeat received from ${espId}`);
      
          // Update device status in DB
          await Device.update({ isOnline: true }, { where: { espId } });
      
          // Optional: reset timeout auto-offline here
          clearTimeout(socket.heartbeatTimeout);
          socket.heartbeatTimeout = setTimeout(async () => {
            console.warn(`💤 Device ${espId} went offline`);
            await Device.update({ isOnline: false }, { where: { espId } });
            io.emit("deviceStatusChange", {
              espId,
              isOnline: false,
            });
          }, 60000); // 60 seconds timeout
      
        } catch (err) {
          console.error(`❌ Heartbeat error: ${err.message}`);
        }
    }),
    socket.on('disconnect', () => {
      if (socket.espId) {
        console.log(`💥 Device ${socket.espId} disconnected`);
    
        // Remove the socket from the map
        deviceSockets.delete(socket.espId);
    
        // Optional: emit to frontend if needed (not required unless you show UI update immediately)
        // io.emit("deviceDisconnected", { espId: socket.espId });
      }
    
      // Also ensure any lingering heartbeat timeout is cleared
      if (socket.heartbeatTimeout) {
        clearTimeout(socket.heartbeatTimeout);
      }
    });
  });
};

export const sendCommandToDevice = (espId, command) => {
  const socket = deviceSockets.get(espId);
  if (socket) {
    console.log(`📤 Sending command to ${espId}: ${command}`);
    socket.emit('deviceCommand', command);
  } else {
    console.warn(`🚫 Cannot send command, ${espId} not connected`);
    console.log('🧩 Currently connected devices:', [...deviceSockets.keys()]);
  }
};
