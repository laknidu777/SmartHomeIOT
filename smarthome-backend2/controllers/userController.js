import { User, UserHome, UserHomeRoom ,Room , UserHomeDevice, Device } from '../models/index.js';

export const getUsersInHome = async (req, res) => {
  try {
    const { homeId } = req.params;
    const requestingUserId = req.userId;

    const userHomes = await UserHome.findAll({
      where: { HouseId: homeId },
      include: [{ model: User }],
    });

    // Filter out current user
    const result = userHomes
      .filter(link => link.UserId !== requestingUserId)
      .map(link => ({
        id: link.User.id,
        email: link.User.email,
        role: link.role,
      }));

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};
export const assignRoomsToUser = async (req, res) => {
  try {
    const { userId, homeId, roomIds } = req.body;

    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: homeId },
    });

    if (!userHome) {
      return res.status(404).json({ message: 'User is not linked to this home' });
    }

    // Remove previous room assignments for this user in this home
    await UserHomeRoom.destroy({ where: { userHomeId: userHome.id } });

    // Add new ones
    const newAssignments = roomIds.map((roomId) => ({
      userHomeId: userHome.id,
      roomId,
    }));

    await UserHomeRoom.bulkCreate(newAssignments);

    res.status(200).json({ message: 'Rooms assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign rooms', error: err.message });
  }
};
export const getRoomsForUser = async (req, res) => {
  try {
    const { userId, homeId } = req.params;

    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: homeId },
    });

    if (!userHome) return res.status(404).json({ message: 'User not linked to this home' });

    const assignments = await UserHomeRoom.findAll({
      where: { userHomeId: userHome.id },
      include: [{ model: Room }],
    });

    const rooms = assignments.map((entry) => entry.Room);
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: err.message });
  }
};
export const assignDevicesToUser = async (req, res) => {
    try {
      const { userId, homeId, deviceIds } = req.body;
  
      const userHome = await UserHome.findOne({
        where: { UserId: userId, HouseId: homeId },
      });
  
      if (!userHome) {
        return res.status(404).json({ message: 'User is not linked to this home' });
      }
  
      // Remove previous device assignments
      await UserHomeDevice.destroy({ where: { userHomeId: userHome.id } });
  
      // Assign new devices
      const newAssignments = deviceIds.map((deviceId) => ({
        userHomeId: userHome.id,
        deviceId,
      }));
  
      await UserHomeDevice.bulkCreate(newAssignments);
  
      res.status(200).json({ message: 'Devices assigned successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to assign devices', error: err.message });
    }
  };

  export const getDevicesForUser = async (req, res) => {
    try {
      const { userId, homeId } = req.params;
  
      const userHome = await UserHome.findOne({
        where: { UserId: userId, HouseId: homeId },
      });
  
      if (!userHome) return res.status(404).json({ message: 'User not linked to this home' });
  
      const assignments = await UserHomeDevice.findAll({
        where: { userHomeId: userHome.id },
        include: [{ model: Device }],
      });
  
      const devices = assignments.map((entry) => entry.Device);
      res.status(200).json(devices);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch devices', error: err.message });
    }
  };
  