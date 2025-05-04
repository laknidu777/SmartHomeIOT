import express from 'express';
import { register, login,logout } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { getUserAssignedRooms } from '../controllers/roomController.js'

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
//router.get('/users/me/rooms', getUserAssignedRooms);
router.post('/logout', logout);

// ✅ Get rooms the current user has access to via UserRoom
//router.get('/users/me/rooms', authenticate,getUserAssignedRooms);
export default router;
