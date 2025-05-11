// ✅ Correct ESM import style
import { UserHome, Device } from '../models/index.js';
//import { deviceSockets, hubSockets } from '../sockets/socketRegistry.js';
export const authorizeDeviceAccess = async (req, res, next) => {
  const deviceId = req.params.id || req.body.deviceId;
const userId = req.userId;
  try {
    const device = await Device.findByPk(deviceId);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const userHome = await UserHome.findOne({
      where: {
        UserId: userId,
        HouseId: device.homeId,
      },
    });
    if (!userHome) return res.status(403).json({ message: 'Access denied to this device' });

    // ✅ Attach device object for controller use
    req.device = device;

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Authorization failed' });
  }
};
