// controllers/roomController.js
import db from '../models/index.js';

const { Room, Home, UserHome, UserRoom } = db;

export const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const { homeId } = req.params;

    const home = await Home.findByPk(homeId);
    if (!home) return res.status(404).json({ message: 'Home not found' });

    if (home.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to add room to this home' });
    }

    const room = await Room.create({ name, homeId });

    // ✅ Automatically assign superadmin to new room
    await UserRoom.create({ userId: req.user.id, roomId: room.id });

    return res.status(201).json(room);
  } catch (err) {
    console.error('Error creating room:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRoomsByHome = async (req, res) => {
  try {
    const { homeId } = req.params;
    const home = await Home.findByPk(homeId);
    if (!home) return res.status(404).json({ message: 'Home not found' });

    if (req.user.role === 'superadmin') {
      if (home.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view rooms for this home' });
      }
    } else {
      const isAssigned = await UserHome.findOne({
        where: { userId: req.user.id, homeId },
      });
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned to this home' });
      }
    }

    const rooms = await Room.findAll({ where: { homeId } });
    return res.status(200).json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const getDevicesForUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = await UserRoom.findAll({ where: { userId } });
    const roomIds = rooms.map(r => r.roomId);

    const devices = await Device.findAll({ where: { roomId: roomIds } });

    return res.status(200).json(devices);
  } catch (err) {
    console.error('Error fetching devices by user rooms:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const getUserAssignedRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = await Room.findAll({
      include: {
        model: db.User,
        where: { id: userId },
        through: { attributes: [] },
      },
    });

    return res.status(200).json(rooms);
  } catch (err) {
    console.error('Error fetching user rooms:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const home = await Home.findByPk(room.homeId);
    if (home.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this room' });
    }

    room.name = name || room.name;
    await room.save();
    return res.status(200).json(room);
  } catch (err) {
    console.error('Error updating room:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const home = await Home.findByPk(room.homeId);
    if (home.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this room' });
    }

    await room.destroy();
    return res.status(200).json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error('Error deleting room:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
