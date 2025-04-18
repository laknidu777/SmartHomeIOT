import db from '../models/index.js';
const Room = db.Room;
const Home = db.Home;

export const createRoom = async (req, res) => {
  const { homeId, name } = req.body;
  try {
    // Ensure the home belongs to the user
    const home = await Home.findOne({ where: { id: homeId, userId: req.user.userId } });
    if (!home) return res.status(403).json({ error: 'Home not found or access denied' });

    const room = await Room.create({ name, homeId });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const getRoomsByHome = async (req, res) => {
  const { homeId } = req.params;
  try {
    const home = await Home.findOne({ where: { id: homeId, userId: req.user.userId } });
    if (!home) return res.status(403).json({ error: 'Home not found or access denied' });

    const rooms = await Room.findAll({ where: { homeId } });
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};
export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const room = await Room.findOne({
      where: { id },
      include: { model: Home, where: { userId: req.user.userId } },
    });
    if (!room) return res.status(403).json({ error: 'Room not found or access denied' });

    room.name = name;
    await room.save();
    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update room' });
  }
};
export const deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    const room = await Room.findOne({
      where: { id },
      include: { model: Home, where: { userId: req.user.userId } },
    });
    if (!room) return res.status(403).json({ error: 'Room not found or access denied' });

    await room.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
};
