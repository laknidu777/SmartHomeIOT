// routes/userAssignmentRoutes.js
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  assignUserToHome,
  assignUserToRoom,
  assignUserToDevice,
  getUsersAssignedToHome,
} from '../controllers/UserAssignmentController.js';

const router = express.Router();

router.use(authenticate);

// Assign user to home (by email)
router.post('/homes/:homeId/assign-user', assignUserToHome);
router.get('/homes/:homeId/assign-user', getUsersAssignedToHome);

// Assign user to room (by userId)
router.post('/rooms/:roomId/assign-user', assignUserToRoom);

// Assign user to device (by userId)
router.post('/devices/:deviceId/assign-user', assignUserToDevice);



export default router;
