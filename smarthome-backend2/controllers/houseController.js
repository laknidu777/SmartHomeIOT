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

