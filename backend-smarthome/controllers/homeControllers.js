import db from '../models/index.js';
const Home = db.Home;

export const createHome = async (req, res) => {
  try {
    const { name, address } = req.body;
    const home = await Home.create({ name, address, userId: req.user.userId });
    res.status(201).json(home);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create home' });
  }
};

export const getHomes = async (req, res) => {
  try {
    const homes = await Home.findAll({
      where: { userId: req.user.userId },
    });

    res.status(200).json({ homes }); // ✅ Wrap it properly
  } catch (err) {
    res.status(500).json({ error: "Could not fetch homes" });
  }
};

// export const getHomes = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const homes = await Home.findAll({
//       where: { userId },
//       attributes: ['id', 'name'],
//       order: [['createdAt', 'DESC']],
//     });

//     res.json({ homes });
//   } catch (err) {
//     console.error("Error fetching homes:", err);
//     res.status(500).json({ error: "Failed to load homes" });
//   }
// };

