import express from 'express';
import { createDevice, getDevicesByRoom,toggleDevice,getAllDevicesForUser,
    updateDevice,
    deleteDevice, assignDeviceToHub,markDeviceOffline} from '../controllers/deviceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/:espId/offline', markDeviceOffline);
router.use(authenticate);
router.post('/', createDevice);
router.get('/all', getAllDevicesForUser);
router.put('/update/:id', updateDevice);
router.delete('/delete/:id', deleteDevice);
router.get('/:roomId', getDevicesByRoom);
router.patch('/toggle/:id', toggleDevice);
router.post('/:espId/assign-hub', assignDeviceToHub);
export default router;
