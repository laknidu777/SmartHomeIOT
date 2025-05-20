import { House, UserHome } from '../models/index.js';

export const createHouse = async (req, res) => {
  try {
    const { name, address } = req.body;
    const userId = req.userId; // from authMiddleware

    const newHouse = await House.create({ name, address });

    await UserHome.create({
        UserId: userId,
        HouseId: newHouse.id,
        role: 'SuperAdmin',
      });
      

    res.status(201).json({ house: newHouse, message: 'House created and linked to user' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create house', error: err.message });
  }
};
export const getUserHouses = async (req, res) => {
  try {
    const userId = req.userId;

    const userHouses = await UserHome.findAll({
      where: { UserId: userId },
      include: [{ model: House }],
    });

    const houses = userHouses.map((entry) => entry.House);
    res.status(200).json(houses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch houses', error: err.message });
  }
};
// controllers/houseController.js
export const updateHouse = async (req, res) => {
  try {
    const { homeId } = req.params;
    const { name, address } = req.body;
    const userId = req.userId;

    // Check if user is SuperAdmin for this house
    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: homeId, role: 'SuperAdmin' },
    });

    if (!userHome) {
      return res.status(403).json({ message: 'Access denied. SuperAdmin only.' });
    }

    const house = await House.findByPk(homeId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    await house.update({ name, address });
    res.json({ message: 'House updated successfully', house });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update house', error: err.message });
  }
};
// controllers/houseController.js
export const deleteHouse = async (req, res) => {
  try {
    const { homeId } = req.params;
    const userId = req.userId;

    // Check if user is SuperAdmin for this house
    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: homeId, role: 'SuperAdmin' },
    });

    if (!userHome) {
      return res.status(403).json({ message: 'Access denied. SuperAdmin only.' });
    }

    const house = await House.findByPk(homeId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    await house.destroy();
    res.json({ message: 'House deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete house', error: err.message });
  }
};
// Get a specific house + user's role
export const getHouseById = async (req, res) => {
  try {
    const { homeId } = req.params;
    const userId = req.userId;

    const userHome = await UserHome.findOne({
      where: { UserId: userId, HouseId: homeId },
    });

    if (!userHome) {
      return res.status(403).json({ message: 'Access denied for this house' });
    }

    const house = await House.findByPk(homeId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    res.json({ house, role: userHome.role });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch house', error: err.message });
  }
};

