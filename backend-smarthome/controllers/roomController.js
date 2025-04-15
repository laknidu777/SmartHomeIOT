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
