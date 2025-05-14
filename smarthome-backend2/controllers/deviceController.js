import { UserHome, UserHomeRoom, UserHomeDevice, Room, Device, NoUserDevice,Hub } from '../models/index.js';
import { deviceSockets, hubSockets ,globalIo } from '../sockets/deviceSocket.js';
//import { deviceSockets } from '../sockets/deviceSocket.js';

export const claimDevice = async (req, res) => {
  try {
    const { name, espId, houseId, roomId } = req.body;
    const userId = req.userId;

    // Step 1: Verify user-home link
    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: houseId },
    });

    if (!userHome) {
      return res.status(403).json({ message: 'User is not linked to this house' });
    }

    // Step 2: Check if device is available in NoUserDevice table
    const noUserEntry = await NoUserDevice.findOne({ where: { espId } });
    if (!noUserEntry) {
      return res.status(404).json({ message: 'Device not online or already claimed' });
    }

    // Step 3: Create and save the Device (id is auto-generated UUID)
    const newDevice = await Device.create({
      name,
      espId,
      RoomId: roomId,
      homeId: houseId,
      isOn: false,
      isOnline: true,
    });

    // Step 4: Link device to userHome
    await UserHomeDevice.create({
      userHomeId: userHome.id,
      deviceId: newDevice.id,
    });

    // Step 5: Send the device UUID (id) to ESP32
    const socket = deviceSockets.get(espId);
    if (socket) {
      socket.emit('assignUuid', { uuid: newDevice.id }); // ✅ UUID = Device.id
      console.log(`✅ UUID sent to ESP32 (${espId}): ${newDevice.id}`);
    } else {
      console.warn(`⚠️ Socket not found for device ${espId}`);
    }

    // Step 6: Clean up NoUserDevice entry
    await NoUserDevice.destroy({ where: { espId } });

    return res.status(201).json({
      message: 'Device successfully claimed and registered',
      device: newDevice,
    });
  } catch (err) {
    console.error('❌ Error in claimDevice:', err);
    return res.status(500).json({ message: 'Failed to claim device', error: err.message });
  }
};

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

    const newDevice = await Device.create({
      name,
      espId,
      RoomId: roomId,
      homeId: houseId,
      isOn: false,      // Start as OFF
      isOnline: false   // Initially offline until ESP32 heartbeat
    });

    await UserHomeDevice.create({
      userHomeId: userHome.id,
      deviceId: newDevice.id,
    });

    res.status(201).json({ device: newDevice, message: 'Device created and linked to user' });
  } catch (err) {
    console.error('Device creation failed:', err);
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
    const { name, roomId } = req.body;

    const device = await Device.findByPk(id);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    device.name = name;
    device.RoomId = roomId; // ✅ this is the key fix

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
    const { hubId } = req.body;

    const device = await Device.findByPk(id);
    const hub = await Hub.findOne({ where: { espId: hubId } });

    if (!device || !hub) {
      return res.status(404).json({ message: 'Device or Hub not found' });
    }

    // Update DB with hub link
    device.assignedHubId = hubId;
    device.hubSsid = hub.ssid;
    device.hubPassword = hub.password;
    await device.save();

    // 🔁 Send ASSIGN directly to the device
    const deviceSocket = deviceSockets.get(device.espId);
    if (deviceSocket) {
      const command = `ASSIGN:${hub.ssid},${hub.password}`;
      deviceSocket.emit("deviceCommand", command);
      console.log(`📡 Sent ASSIGN to device ${device.espId}: ${command}`);
    } else {
      console.warn(`⚠️ Device ${device.espId} not connected to backend`);
    }

    res.status(200).json({ message: 'Device assigned to hub', device });
  } catch (err) {
    console.error('💥 assignDeviceToHub Error:', err);
    res.status(500).json({ message: 'Failed to assign device', error: err.message });
  }
};

export const unassignDeviceFromHub = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findByPk(id);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const hubSocket = hubSockets.get(device.assignedHubId);
    if (hubSocket) {
      const resetCmd = `RESET:${device.espId}`;
      hubSocket.send(resetCmd);
      console.log(`🔄 Sent RESET command to Hub for device ${device.espId}`);
    }

    device.assignedHubId = null;
    device.hubSsid = null;
    device.hubPassword = null;
    await device.save();

    res.status(200).json({ message: 'Device unassigned from hub', device });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unassign device', error: err.message });
  }
};

// export const setDeviceState = async (req, res) => {
//   try {
//     const { id } = req.params;           // ✅ device ID from URL
//     const { state } = req.body;          // ✅ state from body

//     if (state !== 0 && state !== 1) {
//       return res.status(400).json({ message: 'Invalid state. Must be 0 or 1.' });
//     }

//     const device = await Device.findByPk(id);
//     if (!device) {
//       return res.status(404).json({ message: 'Device not found' });
//     }

//     const payload = state === 1 ? "1" : "0"; // always send string for ESP

//     if (device.assignedHubId) {
//       const hubSocket = hubSockets.get(device.assignedHubId);
//       if (!hubSocket) {
//         return res.status(503).json({ message: 'Hub is offline' });
//       }

//       const cmd = `COMMAND:${device.espId}:${payload}`;
//       hubSocket.send(cmd);
//     } else {
//       const deviceSocket = deviceSockets.get(device.espId);
//       if (!deviceSocket) {
//         return res.status(503).json({ message: 'Device is offline' });
//       }

//       deviceSocket.emit("deviceCommand", payload); // ✅ safe array for ESP
//     }

//     return res.status(200).json({ message: 'Command sent' });

//   } catch (err) {
//     console.error('💥 setDeviceState Error:', err);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };
import { toggleDevice } from '../utils/toggleDevice.js';

export const setDeviceState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;

    const success = await toggleDevice(id, state);
    if (!success) {
      return res.status(503).json({ message: 'Device is offline or not found' });
    }

    return res.status(200).json({ message: 'Command sent successfully' });
  } catch (err) {
    console.error('💥 setDeviceState Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const notifyDeviceAssigned = async (req, res) => {
  try {
    const { uuid } = req.params;

    const device = await Device.findOne({ where: { uuid: uuid } });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isOnline = true;
    await device.save();

    console.log(`✅ Assignment confirmed from Hub for device ${device.espId}`);
    res.status(200).json({ message: 'Device assignment confirmed' });
  } catch (err) {
    console.error('❌ notifyDeviceAssigned error:', err.message);
    res.status(500).json({ message: 'Error confirming assignment', error: err.message });
  }
};
export const markDeviceOffline = async (req, res) => {
  try {
    const { uuid } = req.params;

    const device = await Device.findOne({ where: { id: uuid } });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    device.isOnline = false;
    await device.save();

    globalIo.emit('deviceStatusChange', { espId: device.espId, isOnline: false });
    res.status(200).json({ message: 'Device marked offline' });
  } catch (err) {
    console.error('❌ markDeviceOffline error:', err);
    res.status(500).json({ message: 'Failed to mark device offline', error: err.message });
  }
};


