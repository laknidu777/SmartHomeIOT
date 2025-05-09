import { UserHome, UserHomeRoom, UserHomeDevice, Room, Device } from '../models/index.js';

export const createRoom = async (req, res) => {
  try {
    const { houseId, name } = req.body;
    const userId = req.userId;

    // Find UserHome entry
    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: houseId },
    });

    if (!userHome) {
      return res.status(404).json({ message: 'User is not linked to this house' });
    }

    // Create Room and link it to the House
    const newRoom = await Room.create({ name, HouseId: houseId });

    // Link Room to UserHome via UserHomeRoom
    await UserHomeRoom.create({
      userHomeId: userHome.id,
      roomId: newRoom.id,
    });

    res.status(201).json({ room: newRoom, message: 'Room created and linked to user' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create room', error: err.message });
  }
};
export const getRoomsForHouse = async (req, res) => {
    try {
      const houseId = req.params.houseId;
      const userId = req.userId;
  
      const userHome = await UserHome.findOne({
        where: { UserId: userId, HouseId: houseId },
      });
  
      if (!userHome) {
        return res.status(404).json({ message: 'User is not linked to this house' });
      }
  
      const roomLinks = await UserHomeRoom.findAll({
        where: { userHomeId: userHome.id },
        include: [{ model: Room }],
      });
  
      const rooms = roomLinks.map(link => link.Room);
      res.status(200).json(rooms);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch rooms', error: err.message });
    }
  };


  export const getRoomsWithDevices = async (req, res) => {
    try {
      const userId = req.userId;
      const { homeId } = req.params;
  
      const userHome = await UserHome.findOne({
        where: { UserId: userId, HouseId: homeId },
      });
  
      if (!userHome) return res.status(404).json({ message: 'User not linked to this house' });
  
      // Get rooms linked to this userHome
      const roomLinks = await UserHomeRoom.findAll({
        where: { userHomeId: userHome.id },
        include: [{ model: Room }],
      });
  
      const roomIds = roomLinks.map(link => link.Room.id);
  
      // Get all UserHomeDevices for this userHome
      const deviceLinks = await UserHomeDevice.findAll({
        where: { userHomeId: userHome.id },
        include: [{ model: Device }],
      });
  
      const roomMap = {};
      for (const link of roomLinks) {
        const room = link.Room;
        roomMap[room.id] = { ...room.toJSON(), devices: [] };
      }
  
      for (const link of deviceLinks) {
        const device = link.Device;
        if (device.RoomId && roomMap[device.RoomId]) {
          roomMap[device.RoomId].devices.push(device);
        }
      }
  
      const roomsWithDevices = Object.values(roomMap);
      res.status(200).json(roomsWithDevices);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch rooms with devices', error: err.message });
    }
  };
  // PATCH /rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.name = name;
    await room.save();

    res.status(200).json({ message: 'Room updated', room });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update room', error: err.message });
  }
};

// DELETE /rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    await room.destroy();
    res.status(200).json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete room', error: err.message });
  }
};

