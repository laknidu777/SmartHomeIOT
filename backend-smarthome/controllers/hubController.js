import db from '../models/index.js';
const Hub = db.Hub;

export const registerHub = async (req, res) => {
  const { hubId, name, ssid, password } = req.body;

  try {
    const [hub, created] = await Hub.findOrCreate({
      where: { hubId },
      defaults: { name, ssid, password }
    });

    res.status(201).json({ hub, created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to register hub' });
  }
};
