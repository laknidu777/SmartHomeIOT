  import db from '../models/index.js';
  import { sendCommandToDevice } from '../sockets/deviceSocket.js';

  const Device = db.Device;
  const Room = db.Room;
  const Home = db.Home;
  const DeviceLog = db.DeviceLog;

  export const createDevice = async (req, res) => {
    const { roomId, name, type, espId } = req.body;
    try {
      const room = await Room.findOne({
        where: { id: roomId },
        include: { model: db.Home, where: { userId: req.user.userId } },
      });
      if (!room) return res.status(403).json({ error: 'Room not found or access denied' });

      const device = await Device.create({ roomId, name, type, espId });
      res.status(201).json(device);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create device' });
    }
  };

  export const getDevicesByRoom = async (req, res) => {
    const { roomId } = req.params;
    try {
      const room = await Room.findOne({
        where: { id: roomId },
        include: { model: db.Home, where: { userId: req.user.userId } },
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
          include: { model: db.Home, where: { userId: req.user.userId } },
        },
      });

      if (!device) return res.status(404).json({ error: 'Device not found or access denied' });

      const newStatus = !device.isOn;
      device.isOn = newStatus;
      await device.save();

      await DeviceLog.create({
        deviceId: device.id,
        action: newStatus ? 'on' : 'off',
        triggeredBy: 'app',
      });

      sendCommandToDevice(device.espId, newStatus ? 'on' : 'off');

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
          include: { model: db.Home, where: { userId: req.user.userId } },
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

      // Save hub assignment
      device.assignedHubId = hubId;
      device.hubSsid = hubSsid;
      device.hubPassword = hubPassword;
      await device.save();

      // Tell the device to switch networks via WebSocket
      
      const command = `ASSIGN:${hubSsid},${hubPassword}`;
      sendCommandToDevice(espId, command);

      res.json({ message: `Device ${espId} assigned to hub ${hubId}` });
    } catch (err) {
      console.error('❌ assignDeviceToHub error:', err.message);
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
