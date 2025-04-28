import express from 'express';
import { registerHub,
    getHubsByHome,
    getDevicesByHub,
    getUnassignedDevices,
    assignDeviceToHub,
    unassignDeviceFromHub, 
 } from '../controllers/hubController.js';
 import { authenticate } from '../middleware/authMiddleware.js';

 const router = express.Router();
 router.post('/register', authenticate, registerHub);
 router.get('/by-home/:homeId', authenticate, getHubsByHome);
 router.get('/:hubId/devices', authenticate, getDevicesByHub);
 router.get('/unassigned/:homeId', authenticate, getUnassignedDevices);
 router.put('/:hubId/devices/:espId', authenticate, assignDeviceToHub);
 router.delete('/:hubId/devices/:espId', authenticate, unassignDeviceFromHub);
 
 export default router;;
