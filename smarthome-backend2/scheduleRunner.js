import cron from 'node-cron';
import { Op } from 'sequelize';
import { Schedule, UserHomeDevice } from './models/index.js';
import { toggleDevice } from './utils/toggleDevice.js';

cron.schedule('* * * * *', async () => {
  const now = new Date();
  //console.log(`🔄 [SCHEDULE-RUNNER] Running at ${now.toISOString()}`);

  try {
    const schedules = await Schedule.findAll({
      where: {
        status: true,
        time: { [Op.lte]: now },
        [Op.or]: [
          { lastExecuted: null },
          { lastExecuted: { [Op.lt]: now } },
        ],
      },
      include: [{ model: UserHomeDevice }],
    });

    //console.log(`📦 Found ${schedules.length} due schedule(s)`);

    for (const schedule of schedules) {
      const userHomeDevice = schedule.UserHomeDevice;
      if (!userHomeDevice) continue;

      const state = schedule.action === 'on' ? 1 : 0;
      const success = await toggleDevice(userHomeDevice.deviceId, state);

      if (success) {
        console.log(`✅ Schedule toggle success → deviceId: ${userHomeDevice.deviceId}`);

        schedule.lastExecuted = now;

        if (schedule.repeat === 'once') {
          schedule.status = false;
        } else if (schedule.repeat === 'daily') {
          schedule.time.setDate(schedule.time.getDate() + 1);
        } else if (schedule.repeat === 'weekly') {
          schedule.time.setDate(schedule.time.getDate() + 7);
        }

        await schedule.save();
      } else {
        console.warn(`❌ Toggle failed for deviceId: ${userHomeDevice.deviceId}`);
      }
    }

  } catch (err) {
    console.error('⛔ Schedule runner error:', err.message);
  }
});
