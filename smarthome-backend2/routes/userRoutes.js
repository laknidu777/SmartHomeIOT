import express from 'express';
import { getUsersInHome,assignRoomsToUser,getRoomsForUser,assignDevicesToUser,getDevicesForUser } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/in-home/:homeId', authenticate, getUsersInHome);
router.post('/assign-rooms', authenticate, assignRoomsToUser);
router.get('/rooms/:userId/:homeId', authenticate, getRoomsForUser);
router.post('/assign-devices', authenticate, assignDevicesToUser);
router.get('/devices/:userId/:homeId', authenticate, getDevicesForUser);
export default router;