import db from '../models/index.js';
const { Hub, Home, Device, Room } = db;

export const registerHub = async (req, res) => {
  const { hubId, name, ssid, password, homeId } = req.body;

  try {
    if (!hubId || !name || !ssid || !password || !homeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [hub, created] = await Hub.findOrCreate({
      where: { hubId },
      defaults: { name, ssid, password, homeId } // ✅ ADD homeId here
    });

    res.status(201).json({ hub, created });
  } catch (err) {
    console.error("❌ registerHub error:", err);
    res.status(500).json({ message: 'Failed to register hub' });
  }
};
export const getHubsByHome = async (req, res) => {
  const { homeId } = req.params;
  const userId = req.user.userId;

  try {
    const home = await Home.findOne({
      where: { id: homeId, userId },
    });

    if (!home) {
      return res.status(403).json({ error: 'Access denied to this home' });
    }

    const hubs = await Hub.findAll({
      where: { homeId },
      attributes: ['hubId', 'name', 'ssid', 'password', 'lastSeen', 'isOnline']
    });    
    const formattedHubs = hubs.map(hub => ({
      hubId: hub.hubId,
      name: hub.name,
      hubSsid: hub.ssid,
      hubPassword: hub.password,
      isOnline: hub.isOnline,
      lastSeen: hub.lastSeen,
    }));
    res.json(formattedHubs);
  } catch (err) {
    console.error("❌ getHubsByHome error:", err);
    res.status(500).json({ error: "Server error fetching hubs" });
  }
};

export const getDevicesByHub = async (req, res) => {
  const { hubId } = req.params;
  const userId = req.user.userId;

  try {
    const hub = await Hub.findOne({
      where: { hubId },
      include: {
        model: Home,
        where: { userId },
      }
    });

    if (!hub) return res.status(403).json({ error: "Access denied to this hub" });

    const devices = await Device.findAll({
      where: { assignedHubId: hubId },
    });

    res.json(devices);
  } catch (err) {
    console.error("❌ getDevicesByHub error:", err);
    res.status(500).json({ error: "Server error fetching devices" });
  }
};

export const getUnassignedDevices = async (req, res) => {
  const { homeId } = req.params;
  const userId = req.user.userId;

  try {
    const home = await Home.findOne({
      where: { id: homeId, userId },
    });

    if (!home) return res.status(403).json({ error: "Access denied to this home" });

    const devices = await Device.findAll({
      where: { assignedHubId: null },
      include: {
        model: Room,
        where: { homeId },
      }
    });

    res.json(devices);
  } catch (err) {
    console.error("❌ getUnassignedDevices error:", err);
    res.status(500).json({ error: "Server error fetching unassigned devices" });
  }
};

export const assignDeviceToHub = async (req, res) => {
  const { hubId, espId } = req.params;
  const userId = req.user.userId;

  try {
    const hub = await Hub.findOne({
      where: { hubId },
      include: {
        model: Home,
        where: { userId },
      }
    });

    if (!hub) return res.status(403).json({ error: "Access denied to this hub" });

    const device = await Device.findOne({ where: { espId } });
    if (!device) return res.status(404).json({ error: "Device not found" });

    await device.update({
      assignedHubId: hubId,
      hubSsid: hub.ssid,
      hubPassword: hub.password,
    });

    res.json({ message: `Device ${espId} assigned to hub ${hubId}` });
  } catch (err) {
    console.error("❌ assignDeviceToHub error:", err);
    res.status(500).json({ error: "Failed to assign device" });
  }
};

export const unassignDeviceFromHub = async (req, res) => {
  const { hubId, espId } = req.params;
  const userId = req.user.userId;

  try {
    const hub = await Hub.findOne({
      where: { hubId },
      include: {
        model: Home,
        where: { userId },
      }
    });

    if (!hub) return res.status(403).json({ error: "Access denied to this hub" });

    const device = await Device.findOne({ where: { espId, assignedHubId: hubId } });
    if (!device) return res.status(404).json({ error: "Device not found or not assigned to this hub" });

    await device.update({
      assignedHubId: null,
      hubSsid: null,
      hubPassword: null,
    });

    res.json({ message: `Device ${espId} unassigned from hub ${hubId}` });
  } catch (err) {
    console.error("❌ unassignDeviceFromHub error:", err);
    res.status(500).json({ error: "Failed to unassign device" });
  }
};
