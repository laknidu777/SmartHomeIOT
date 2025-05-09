import express from 'express';
import { createDevice, getDevicesForRoom,updateDevice,deleteDevice,assignDeviceToHub } from '../controllers/deviceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', authenticate, createDevice);
router.get('/:roomId', authenticate, getDevicesForRoom);

// ✅ Add these:
router.patch('/:id', authenticate, updateDevice);
router.delete('/:id', authenticate, deleteDevice);
// Hub assignment
router.patch('/:id/assign-hub', authenticate, assignDeviceToHub);
export default router;
