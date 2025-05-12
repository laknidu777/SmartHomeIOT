// deviceSocket.js
import { Device, Hub,NoUserDevice  } from '../models/index.js';
const deviceSockets = new Map();
const hubSockets = new Map();  // ✅ Track hub sockets
const lastHeartbeats = {};

export const registerDeviceSocketHandlers = (io) => {
  setInterval(async () => {
    const now = Date.now();
    for (const [espId, lastTime] of Object.entries(lastHeartbeats)) {
      if (now - lastTime > 65000) {
        const device = await Device.findOne({ where: { espId } });
        if (device && device.isOnline) {
          await Device.update({ isOnline: false }, { where: { espId } });
          io.emit('deviceStatusChange', { espId, isOnline: true });
          io.emit('deviceStatusChange', { espId, isOnline: false });
          console.log(`💤 Device ${espId} marked offline due to heartbeat timeout`);
        }
      }
    }
  }, 30000);
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id, 'from', socket.handshake.address);
    // socket.on('registerDevice', async (data) => {
    //   try {
    //     console.log("📩 registerDevice raw data:", data); // << ADD THIS LINE
    //     const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    //     const espId = parsed.espId;
    //     if (!espId) throw new Error('espId missing');

    //     console.log(`📲 Device registered: ${espId}`);
    //     deviceSockets.set(espId, socket);
    //     socket.espId = espId;

    //     await Device.update({ isOnline: true }, { where: { espId } });
    //     lastHeartbeats[espId] = Date.now();

    //     io.emit('deviceStatusChange', { espId, isOnline: true });
    //   } catch (err) {
    //     console.error('❌ registerDevice error:', err.message);
    //   }
    // });
    socket.on('registerDevice', async (data) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        const espId = parsed.espId;
        if (!espId) throw new Error('espId missing');

        console.log(`📲 Device attempting to register: ${espId}`);
        deviceSockets.set(espId, socket);
        socket.espId = espId;
        lastHeartbeats[espId] = Date.now();

        // 1. If already claimed → update isOnline
        const claimedDevice = await Device.findOne({ where: { espId } });
        if (claimedDevice) {
          await claimedDevice.update({ isOnline: true });
          io.emit('deviceStatusChange', { espId, isOnline: true });
          console.log(`✅ Claimed device ${espId} is online`);
        } else {
          // 2. Not yet claimed → insert into NoUserDevice
          await NoUserDevice.upsert({ espId });
          console.log(`🆕 Unclaimed device ${espId} inserted into NoUserDevice`);
        }

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
    socket.on('registerHub', async (data) => {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const { hubId } = parsed;
    if (!hubId) throw new Error("hubId missing");

    // 🔁 Disconnect old socket if already registered
    if (hubSockets.has(hubId)) {
      const oldSocket = hubSockets.get(hubId);
      if (oldSocket.id !== socket.id) {
        console.log(`⚠️ Hub ${hubId} already connected. Replacing old socket.`);
        oldSocket.disconnect();
      }
    }
    hubSockets.set(hubId, socket);
    socket.hubId = hubId;
    //update DB
    await db.Hub.update(
      { isOnline: true, lastSeen: new Date() },
      { where: { hubId } }
    );

    console.log(`📡 Hub registered: ${hubId}`);
  } catch (err) {
    console.error("❌ registerHub error:", err.message);
  }
});
socket.on("error", (err) => {
  console.error("🔥 Socket error on device:", socket.espId, err);
});
socket.on('message', async (msg) => {
  try {
    if (typeof msg === 'string' && msg.startsWith('TOGGLED:')) {
      const state = msg.split(':')[1] === '1';
      const espId = socket.espId;

      console.log(`📩 Received TOGGLED message: ${msg}`);
      console.log(`🔍 socket.espId = ${espId}`);

      if (!espId) {
        console.warn("❌ Received TOGGLED but no espId on socket");
        return;
      }

      const updated = await Device.update({ isOn: state }, { where: { espId } });

      if (updated[0] === 0) {
        console.warn(`⚠️ No DB row updated for espId: ${espId}`);
      } else {
        console.log(`✅ DB updated: ${espId} is now ${state ? "ON" : "OFF"}`);
        socket.broadcast.emit('deviceStateChanged', { espId, isOn: state });
      }
    } else {
      console.log(`⚠️ Ignored message: ${msg}`);
    }
  } catch (err) {
    console.error('💥 Error processing TOGGLED message:', err);
  }
});
    socket.on('disconnect', async () => {
      if (socket.espId) {
        deviceSockets.delete(socket.espId);
        console.log(`💥 Device ${socket.espId} disconnected`);
      }
    
      if (socket.hubId) {
        hubSockets.delete(socket.hubId);
        console.log(`💥 Hub ${socket.hubId} disconnected`);
    
        // ⛔ Mark hub offline in DB
        await db.Hub.update(
          { isOnline: false },
          { where: { hubId: socket.hubId } }
        );
      }
    });    
  });
};
// export const sendCommandToDevice = async (espId, command) => {
//   try {
//     const device = await Device.findOne({ where: { espId } });

//     if (!device) {
//       console.warn(`❌ Device ${espId} not found in DB`);
//       return;
//     }
//     if (device.assignedHubId) {
//       const hubSocket = hubSockets.get(device.assignedHubId);
//       if (hubSocket) {
//         const wsCommand = `COMMAND:${espId}:${command}`;
//         console.log(`📡 Routing command via hub ${device.assignedHubId}: ${wsCommand}`);
//         hubSocket.send(wsCommand);
//       } else {
//         console.warn(`⚠️ Hub ${device.assignedHubId} not connected`);
//       }
//       return;
//     }
//     const deviceSocket = deviceSockets.get(espId);
//     if (deviceSocket) {
//       console.log(`📤 Sending direct command to ${espId}: ${command}`);
//       deviceSocket.emit("deviceCommand", command === "on" ? "1" : command === "off" ? "0" : command);
//     } else {
//       console.warn(`🚫 Device ${espId} not connected`);
//     }

//   } catch (err) {
//     console.error("💥 Error in sendCommandToDevice:", err);
//   }
// };
// Export both socket maps to be reused in other files
export { deviceSockets, hubSockets };
