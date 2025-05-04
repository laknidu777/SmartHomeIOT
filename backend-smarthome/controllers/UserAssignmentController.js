// controllers/userAssignmentController.js
import db from '../models/index.js';

const { User, Home, UserHome, Room, Device } = db;

// ✅ Assign user to a home
export const assignUserToHome = async (req, res) => {
  const { homeId } = req.params;
  const { email } = req.body;

  try {
    const home = await Home.findByPk(homeId);
    if (!home || home.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized or invalid home' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await UserHome.findOne({ where: { userId: user.id, homeId } });
    if (existing) return res.status(400).json({ message: 'User already assigned to home' });

    await UserHome.create({ userId: user.id, homeId });
    return res.status(200).json({ message: 'User assigned to home' });
  } catch (err) {
    console.error('Error assigning user:', err);
    res.status(500).json({ message: 'Internal error' });
  }
};

// ✅ Assign user to specific room
export const assignUserToRoom = async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  try {
    const room = await Room.findByPk(roomId, { include: Home });
    if (!room || room.Home.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized or invalid room' });
    }

    // Optional: create UserRoom table and model
    await db.UserRoom.create({ userId, roomId });
    res.status(200).json({ message: 'User assigned to room' });
  } catch (err) {
    console.error('Error assigning user to room:', err);
    res.status(500).json({ message: 'Internal error' });
  }
};

// ✅ Assign user to specific device
export const assignUserToDevice = async (req, res) => {
  const { deviceId } = req.params;
  const { userId } = req.body;

  try {
    const device = await Device.findByPk(deviceId, {
      include: { model: Room, include: Home },
    });

    if (!device || device.Room.Home.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized or invalid device' });
    }

    device.assignedUser = userId;
    await device.save();

    res.status(200).json({ message: 'User assigned to device' });
  } catch (err) {
    console.error('Error assigning user to device:', err);
    res.status(500).json({ message: 'Internal error' });
  }
};
// Get users assigned to a home
export const getUsersAssignedToHome = async (req, res) => {
    const { homeId } = req.params;
    try {
      const assignments = await UserHome.findAll({
        where: { homeId },
        include: [{ model: User, attributes: ['id', 'email', 'name'] }]
      });
  
      const users = assignments.map(a => ({
        id: a.User.id,
        email: a.User.email,
        name: a.User.name,
        role: a.role
      }));
  
      return res.json({ users });
    } catch (err) {
      console.error('Failed to fetch users for home:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  