import { Schedule, UserHome, UserHomeDevice, Device, Room } from '../models/index.js';

export const createSchedule = async (req, res) => {
  try {
    const { deviceId, roomId, action, time, repeat } = req.body;
    const userId = req.userId;

    // Find the home and userHome link
    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: room.HouseId }
    });
    if (!userHome) return res.status(403).json({ message: 'Access denied' });

    // Find the UserHomeDevice entry
    const userHomeDevice = await UserHomeDevice.findOne({
      where: { userHomeId: userHome.id, deviceId }
    });
    if (!userHomeDevice) return res.status(403).json({ message: 'User does not have access to this device' });

    const schedule = await Schedule.create({
      userHomeDeviceId: userHomeDevice.id,
      action,
      time,
      repeat
    });

    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create schedule', error: err.message });
  }
};


export const getSchedulesForRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: room.HouseId },
    });
    if (!userHome) return res.status(403).json({ message: 'Access denied' });

    const userHomeDevices = await UserHomeDevice.findAll({
      where: { userHomeId: userHome.id },
      include: [
        {
          model: Device,
          where: { RoomId: roomId },
        },
      ],
    });

    const deviceIds = userHomeDevices.map(link => link.id);

    const schedules = await Schedule.findAll({
      where: { userHomeDeviceId: deviceIds },
      include: [
        {
          model: UserHomeDevice,
          include: [{ model: Device }]
        }
      ]
    });

    res.status(200).json(schedules);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch schedules', error: err.message });
  }
};
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId, roomId, action, time, repeat } = req.body;
    const userId = req.userId;

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: room.HouseId }
    });
    if (!userHome) return res.status(403).json({ message: 'Access denied' });

    const userHomeDevice = await UserHomeDevice.findOne({
      where: { userHomeId: userHome.id, deviceId }
    });
    if (!userHomeDevice) return res.status(403).json({ message: 'User does not have access to this device' });

    const schedule = await Schedule.findByPk(id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    await schedule.update({
      userHomeDeviceId: userHomeDevice.id,
      action,
      time,
      repeat
    });

    res.status(200).json(schedule);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update schedule', error: err.message });
  }
};


export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const schedule = await Schedule.findByPk(id, {
      include: {
        model: UserHomeDevice,
        include: [{ model: UserHome }]
      }
    });

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    const userHome = schedule.UserHomeDevice.UserHome;
    if (userHome.UserId !== userId) return res.status(403).json({ message: 'Access denied' });

    await schedule.destroy();
    res.status(200).json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete schedule', error: err.message });
  }
};
