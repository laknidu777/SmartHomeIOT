// controllers/homeController.js
import db from '../models/index.js';

const { Home, UserHome, Room } = db;

export const createHome = async (req, res) => {
  try {
    const { name } = req.body;
    const ownerId = req.user.id;

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can create homes.' });
    }

    const home = await Home.create({ name, ownerId });
    return res.status(201).json(home);
  } catch (err) {
    console.error('Error creating home:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getMyHomes = async (req, res) => {
  try {
    let homes;

    if (req.user.role === 'superadmin') {
      // Fetch homes created by this superadmin
      homes = await Home.findAll({
        where: { ownerId: req.user.id },
        include: [Room],
      });
    } else {
      // Fetch homes assigned to this user via UserHome
      homes = await Home.findAll({
        include: [
          {
            model: UserHome,
            where: { userId: req.user.id },
            attributes: [],
          },
          Room,
        ],
      });
    }

    return res.status(200).json(homes);
  } catch (err) {
    console.error('Error fetching homes:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
