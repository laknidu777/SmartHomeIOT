import bcrypt from 'bcrypt';

export const checkDeviceType = async (req, res, next) => {
  const device = req.device; // ✅ already fetched and authorized

  if (!device) return res.status(403).json({ message: 'Unauthorized device access' });

  req.deviceType = device.type;

  if (device.type === 'doorlock') {
    const pin = req.body.pin;
    if (!pin) return res.status(400).json({ message: 'PIN is required for doorlock' });

    const isMatch = await bcrypt.compare(pin, device.pin || '');
    if (!isMatch) return res.status(403).json({ message: 'Invalid PIN' });
  }

  next();
};
