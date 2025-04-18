// deviceSocket.js
import db from '../models/index.js';
const Device = db.Device;
const deviceSockets = new Map();
const lastHeartbeats = {};

export const registerDeviceSocketHandlers = (io) => {
  // Periodic check every 30s to mark offline devices
  setInterval(async () => {
    const now = Date.now();
    for (const [espId, lastTime] of Object.entries(lastHeartbeats)) {
      if (now - lastTime > 65000) {
        const device = await Device.findOne({ where: { espId } });
        if (device && device.isOnline) {
          await Device.update({ isOnline: false }, { where: { espId } });
          io.emit("deviceStatusChange", { espId, isOnline: true });
          io.emit('deviceStatusChange', { espId, isOnline: false });
          console.log(`💤 Device ${espId} marked offline due to heartbeat timeout`);
        }
      }
    }
  }, 30000); // Check every 30 seconds

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id, 'from', socket.handshake.address);

    socket.on('registerDevice', async (data) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const espId = parsed.espId;
        if (!espId) throw new Error('espId missing');

        console.log(`📲 Device registered: ${espId}`);
        deviceSockets.set(espId, socket);
        socket.espId = espId;

        await Device.update({ isOnline: true }, { where: { espId } });
        lastHeartbeats[espId] = Date.now();

        io.emit('deviceStatusChange', { espId, isOnline: true });
      } catch (err) {
        console.error('❌ registerDevice error:', err.message);
      }
    });

    socket.on('heartbeat', async (data) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const espId = parsed.espId;
        if (!espId) throw new Error('espId missing');

        console.log(`❤️ Heartbeat from ${espId}`);
        lastHeartbeats[espId] = Date.now();

        await Device.update({ isOnline: true }, { where: { espId } });
        io.emit('deviceStatusChange', { espId, isOnline: true });
      } catch (err) {
        console.error('❌ heartbeat error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      const espId = socket.espId;
      if (espId) {
        deviceSockets.delete(espId);
        console.log(`💥 Device ${espId} disconnected`);
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
