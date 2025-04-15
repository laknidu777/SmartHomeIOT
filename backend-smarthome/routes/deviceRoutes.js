import express from 'express';
import { createDevice, getDevicesByRoom,toggleDevice } from '../controllers/deviceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', createDevice);
router.get('/:roomId', getDevicesByRoom);
router.patch('/toggle/:id', toggleDevice);

export default router;
