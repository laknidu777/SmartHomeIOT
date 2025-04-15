import db from '../models/index.js';
import { sendCommandToDevice } from '../sockets/deviceSocket.js';

const Device = db.Device;
const Room = db.Room;
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
