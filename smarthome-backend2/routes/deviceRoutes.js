import express from 'express';
import { createDevice, getDevicesForRoom,updateDevice,deleteDevice,assignDeviceToHub,setDeviceState,
    claimDevice
 } from '../controllers/deviceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeDeviceAccess } from '../middlewares/authorizeDeviceAccess.js';

const router = express.Router();

router.post('/claim', authenticate, claimDevice);
router.post('/create', authenticate, createDevice);
router.get('/:roomId', authenticate, getDevicesForRoom);

// ✅ Add these:
router.patch('/:id', authenticate, updateDevice);
router.delete('/:id', authenticate, deleteDevice);
// Hub assignment
router.patch('/:id/assign-hub', authenticate, assignDeviceToHub);

//toggle state
router.patch('/:id/state', authenticate, authorizeDeviceAccess, setDeviceState);
export default router;
