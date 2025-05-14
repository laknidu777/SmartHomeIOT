// toggleDevice.js
import { deviceSockets, hubSockets } from '../sockets/deviceSocket.js';
import { Device } from '../models/index.js';

export const toggleDevice = async (deviceId, state) => {
  try {
    if (state !== 0 && state !== 1) return false;

    const device = await Device.findByPk(deviceId);
    if (!device) return false;

    const command = state.toString();

    if (device.assignedHubId) {
      const hubSocket = hubSockets.get(device.assignedHubId);
      if (!hubSocket) return false;

      const cmd = `COMMAND:${device.id}:${command}`;
      hubSocket.send(cmd);
      console.log(`📡 Sent COMMAND to hub (${device.assignedHubId}) → ${cmd}`);
    } else {
      const deviceSocket = deviceSockets.get(device.espId);
      if (!deviceSocket) return false;

      deviceSocket.emit("deviceCommand", {
        uuid: device.id,
        command
      });
      console.log(`📡 Sent command directly to device ${device.espId}`);
    }

    // Update isOn in DB
    device.isOn = state;
    await device.save();

    return true;
  } catch (err) {
    console.error("💥 toggleDevice error:", err.message);
    return false;
  }
};
