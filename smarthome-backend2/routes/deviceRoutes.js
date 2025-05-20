import express from 'express';
import { createDevice, getDevicesForRoom,updateDevice,deleteDevice,assignDeviceToHub,setDeviceState,
    claimDevice,unassignDeviceFromHub,notifyDeviceAssigned,markDeviceOffline,getHubDeviceAssignmentOverview
 } from '../controllers/deviceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorizeDeviceAccess } from '../middlewares/authorizeDeviceAccess.js';
import { checkDeviceType } from '../middlewares/checkDeviceType.js';

const router = express.Router();

router.post('/claim', authenticate, claimDevice);
router.post('/create', authenticate, createDevice);
router.get('/:roomId', authenticate, getDevicesForRoom);

// ✅ Add these:
router.patch('/:id', authenticate, updateDevice);
router.delete('/:id', authenticate, deleteDevice);
// Hub assignment
router.patch('/:id/assign-hub', authenticate, assignDeviceToHub);
router.patch('/:id/unassign-hub', authenticate, unassignDeviceFromHub);

//router.get('/hub/:hubId', authenticate, getDevicesForHub);
router.get('/hub/:hubId/assignment-overview', authenticate, getHubDeviceAssignmentOverview);



router.post('/devices/:uuid/assigned', notifyDeviceAssigned);
router.post('/:uuid/offline', markDeviceOffline);



//toggle state
router.patch('/:id/state', authenticate, authorizeDeviceAccess, checkDeviceType, setDeviceState);
export default router;
