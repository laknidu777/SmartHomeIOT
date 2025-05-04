  import db from '../models/index.js';
  import { sendCommandToDevice, hubSockets,deviceSockets  } from '../sockets/deviceSocket.js';

  const Device = db.Device;
  const Room = db.Room;
  const Home = db.Home;
  const DeviceLog = db.DeviceLog;

  export const createDevice = async (req, res) => {
    const { roomId, name, type, espId } = req.body;
    try {
      const room = await Room.findOne({
        where: { id: roomId },
        include: { model: db.Home, where: { ownerId: req.user.id } },
      });
      if (!room) return res.status(403).json({ error: 'Room not found or access denied' });

      const device = await Device.create({ roomId, name, type, espId });
      res.status(201).json(device);
    } catch (err) {
      console.error('❌ createDevice error:', err);
      res.status(500).json({ error: 'Failed to create device' });
    }
  };

  export const getDevicesByRoom = async (req, res) => {
    const { roomId } = req.params;
    try {
      const room = await Room.findOne({
        where: { id: roomId },
        include: { model: db.Home, where: { ownerId: req.user.id } },
      });
      if (!room) return res.status(403).json({ error: 'Room not found or access denied' });

      const devices = await Device.findAll({ where: { roomId } });
      res.status(200).json(devices);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  };

  export const toggleDevice = async (req, res) => {
    const { id } = req.params;
    try {
      const device = await Device.findOne({
        where: { id },
        include: {
          model: db.Room,
          include: { model: db.Home, where: { ownerId: req.user.id  } },
        },
      });
  
      if (!device) return res.status(404).json({ error: 'Device not found or access denied' });
  
      const newStatus = !device.isOn;
      device.isOn = newStatus;
      await device.save();
  
      await db.DeviceLog.create({
        deviceId: device.id,
        action: newStatus ? 'on' : 'off',
        triggeredBy: 'app',
      });
      console.log("➡️ Device:", device.espId);
      console.log("🧠 assignedHubId from DB:", device.assignedHubId);
      console.log("📡 Connected hubs:", [...hubSockets.keys()]);

      if (device.assignedHubId && hubSockets.has(device.assignedHubId)) {
        const hubSocket = hubSockets.get(device.assignedHubId);
        hubSocket.emit("hubToggleCommand", [device.espId, newStatus ? "1" : "0"]);
        console.log(`📤 Routed toggle to hub ${device.assignedHubId} for ${device.espId}`);
      } else {
        sendCommandToDevice(device.espId, newStatus ? '1' : '0'); // ✅ Match Arduino
      }
  
      res.status(200).json({
        message: `Device ${newStatus ? 'ON' : 'OFF'}`,
        isOn: newStatus,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to toggle device' });
    }
  };

  export const getDeviceLogs = async (req, res) => {
    const { id } = req.params;

    try {
      const device = await Device.findOne({
        where: { id },
        include: {
          model: db.Room,
          include: { model: db.Home, where: { ownerId: req.user.userId } },
        },
      });

      if (!device) return res.status(404).json({ error: 'Device not found or access denied' });

      const logs = await DeviceLog.findAll({ where: { deviceId: id }, order: [['createdAt', 'DESC']] });
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Could not fetch logs' });
    }
  };
  // controllers/deviceController.js
  export const getAllDevicesForUser = async (req, res) => {
    try {
      const userId = req.user.userId;

      const devices = await Device.findAll({
        include: {
          model: Room,
          include: {
            model: Home,
            where: { userId },
          }
        },
      });

      res.status(200).json(devices);
    } catch (err) {
      console.error("❌ Error fetching all user devices:", err);
      res.status(500).json({ error: "Failed to fetch devices" });
    }
  };
  export const updateDevice = async (req, res) => {
    const { id } = req.params;
    const { name, type, espId, roomId } = req.body;

    try {
      const device = await Device.findOne({
        where: { id },
        include: {
          model: Room,
          include: {
            model: Home,
            where: { userId: req.user.userId },
          },
        },
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found or access denied' });
      }

      // Update fields if provided
      device.name = name ?? device.name;
      device.type = type ?? device.type;
      device.espId = espId ?? device.espId;

      // Optional: Verify the room belongs to the same user before assigning
      if (roomId) {
        const room = await Room.findOne({
          where: { id: roomId },
          include: { model: Home, where: { userId: req.user.userId } },
        });

        if (!room) {
          return res.status(403).json({ error: 'Invalid room or access denied' });
        }

        device.roomId = roomId;
      }

      await device.save();

      res.status(200).json({ message: 'Device updated', device });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update device' });
    }
  };


  export const deleteDevice = async (req, res) => {
    const { id } = req.params;

    try {
      const device = await Device.findOne({
        where: { id },
        include: {
          model: Room,
          include: { model: Home, where: { userId: req.user.userId } },
        },
      });

      if (!device) return res.status(404).json({ error: 'Device not found or access denied' });

      await device.destroy();

      res.status(200).json({ message: 'Device deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete device' });
    }
  };
  export const assignDeviceToHub = async (req, res) => {
    const { espId } = req.params;
    const { hubId, hubSsid, hubPassword } = req.body;
  
    try {
      const device = await Device.findOne({ where: { espId } });
      if (!device) return res.status(404).json({ message: 'Device not found' });
  
      // Update database
      device.assignedHubId = hubId;
      device.hubSsid = hubSsid;
      device.hubPassword = hubPassword;
      await device.save();
  
      const command = `ASSIGN:${hubSsid},${hubPassword}`;
      const socket = deviceSockets.get(espId);
  
      if (socket) {
        console.log(`📤 Sending ASSIGN directly to device ${espId}`);
        socket.emit("deviceCommand", command);
      } else if (hubSockets.has(hubId)) {
        console.log(`📤 Device not connected — routing ASSIGN to hub ${hubId}`);
        hubSockets.get(hubId).emit("hubAssignCommand", [espId, hubSsid, hubPassword]);
      } else {
        console.warn(`⚠️ Cannot assign device — device and hub both offline.`);
      }
  
      res.json({ message: `Device ${espId} assigned to hub ${hubId}` });
    } catch (err) {
      console.error("❌ assignDeviceToHub error:", err.message);
      res.status(500).json({ message: 'Internal error' });
    }
  };  
  export const markDeviceOffline = async (req, res) => {
    const { espId } = req.params;

    try {
      const device = await Device.findOne({ where: { espId } });
      if (!device) return res.status(404).json({ message: 'Device not found' });

      if (device.isOnline) {
        await Device.update({ isOnline: false }, { where: { espId } });
        req.io.emit('deviceStatusChange', { espId, isOnline: false });
        console.log(`💤 [Hub] Device ${espId} marked offline`);
      }

      res.status(200).json({ message: 'Device marked offline' });
    } catch (err) {
      console.error("❌ markDeviceOffline error:", err.message);
      res.status(500).json({ message: 'Internal error' });
    }
  };
  export const unassignDeviceFromHub = async (req, res) => {
    const { espId } = req.params;
  
    try {
      const device = await Device.findOne({ where: { espId } });
      if (!device) return res.status(404).json({ message: 'Device not found' });
  
      const hubId = device.assignedHubId;
      console.log(`🔄 Unassigning ${espId} from hub ${hubId}`);
  
      // Step 1: Clear assignment in DB
      device.assignedHubId = null;
      device.hubSsid = null;
      device.hubPassword = null;
      await device.save();
  
      // Step 2: Route RESET command with improved debugging
      if (deviceSockets.has(espId)) {
        const socket = deviceSockets.get(espId);
        console.log(`📤 Sending reset directly to device ${espId}`);
        socket.emit("deviceCommand", "reset");
      } else if (hubSockets.has(hubId)) {
        const hubSocket = hubSockets.get(hubId);
        console.log(`📤 Sending reset to hub ${hubId} for device ${espId}`);
        hubSocket.emit("hubResetCommand", [espId]);
      } else {
        console.warn(`⚠️ Could not reach ${espId} — not connected to hub or backend`);
      }
  
      req.io.emit('deviceStatusChange', { espId, isOnline: false });
      return res.status(200).json({ message: `Device ${espId} unassigned from hub` });
    } catch (err) {
      console.error("❌ unassignDeviceFromHub error:", err.message);
      res.status(500).json({ message: "Internal error" });
    }
  };