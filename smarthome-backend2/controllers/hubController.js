import { Hub } from '../models/index.js';

export const createHub = async (req, res) => {
  try {
    const { name, espId, ssid, password, houseId } = req.body;

    const newHub = await Hub.create({
      name,
      espId,
      ssid,
      password,
      HouseId: houseId,
    });

    res.status(201).json({ hub: newHub, message: 'Hub created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create hub', error: err.message });
  }
};

export const getHubsForHouse = async (req, res) => {
  try {
    const { houseId } = req.params;

    const hubs = await Hub.findAll({ where: { HouseId: houseId } });
    res.status(200).json(hubs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch hubs', error: err.message });
  }
};
// PATCH /hubs/:id
export const updateHub = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ssid, password } = req.body;

    const hub = await Hub.findByPk(id);
    if (!hub) return res.status(404).json({ message: 'Hub not found' });

    hub.name = name;
    hub.ssid = ssid;
    hub.password = password;
    await hub.save();

    res.status(200).json({ message: 'Hub updated', hub });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update hub', error: err.message });
  }
};

// DELETE /hubs/:id
export const deleteHub = async (req, res) => {
  try {
    const { id } = req.params;
    const hub = await Hub.findByPk(id);
    if (!hub) return res.status(404).json({ message: 'Hub not found' });

    await hub.destroy();
    res.status(200).json({ message: 'Hub deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete hub', error: err.message });
  }
};
