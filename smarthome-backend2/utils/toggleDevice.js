import { deviceSockets, hubSockets } from '../sockets/deviceSocket.js';
import { Device } from '../models/index.js';

export const toggleDevice = async (deviceId, state) => {
  try {
    if (state !== 0 && state !== 1) return false;

    const device = await Device.findByPk(deviceId);
    if (!device) return false;

    const payload = {
      uuid: device.id,           // ✅ Send UUID for validation
      command: state.toString()  // Always send "0" or "1" as string
    };

    if (device.assignedHubId) {
      const hubSocket = hubSockets.get(device.assignedHubId);
      if (!hubSocket) return false;

      const cmd = `COMMAND:${device.espId}:${payload.command}`;
      hubSocket.send(cmd); // hub doesn't need UUID check, sends raw command
    } else {
      const deviceSocket = deviceSockets.get(device.espId);
      if (!deviceSocket) return false;

      deviceSocket.emit("deviceCommand", (payload));
    }

    return true;
  } catch (err) {
    console.error("💥 toggleDevice error:", err.message);
    return false;
  }
};
