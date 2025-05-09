import { UserHome, UserHomeRoom, UserHomeDevice, Room, Device } from '../models/index.js';


export const createDevice = async (req, res) => {
  try {
    const { name, espId, houseId, roomId } = req.body;
    const userId = req.userId;

    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: houseId },
    });

    if (!userHome) {
      return res.status(404).json({ message: 'User is not linked to this house' });
    }

    const newDevice = await Device.create({ name, espId, RoomId: roomId });

    await UserHomeDevice.create({
      userHomeId: userHome.id,
      deviceId: newDevice.id,
    });

    res.status(201).json({ device: newDevice, message: 'Device created and linked to user' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create device', error: err.message });
  }
};
export const getDevicesForRoom = async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.userId;
  
      const room = await Room.findByPk(roomId);
      if (!room) return res.status(404).json({ message: 'Room not found' });
  
      const userHome = await UserHome.findOne({
        where: { UserId: userId, HouseId: room.HouseId },
      });
  
      if (!userHome) {
        return res.status(403).json({ message: 'User does not have access to this house' });
      }
  
      const deviceLinks = await UserHomeDevice.findAll({
        where: { userHomeId: userHome.id },
        include: [{ model: Device, where: { RoomId: roomId } }],
      });
  
      const devices = deviceLinks.map(link => link.Device);
      res.status(200).json(devices);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch devices', error: err.message });
    }
  };
 // PATCH /devices/:id
export const updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, roomId } = req.body;

    const device = await Device.findByPk(id);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    device.name = name;
    device.type = type;
    device.roomId = roomId;
    await device.save();

    res.status(200).json({ message: 'Device updated', device });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update device', error: err.message });
  }
};

// DELETE /devices/:id
export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findByPk(id);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    await device.destroy();
    res.status(200).json({ message: 'Device deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete device', error: err.message });
  }
};
// PATCH /devices/:id/assign-hub
export const assignDeviceToHub = async (req, res) => {
  try {
    const { id } = req.params;
    const { hubId, ssid, password } = req.body;

    const device = await Device.findByPk(id);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    device.assignedHubId = hubId;
    device.hubSsid = ssid;
    device.hubPassword = password;

    await device.save();

    res.status(200).json({ message: 'Device assigned to hub', device });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign device', error: err.message });
  }
};


