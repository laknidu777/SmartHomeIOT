import express from 'express';
import { createRoom, getRoomsByHome,getUserAssignedRooms,updateRoom,deleteRoom } from '../controllers/roomController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);
router.post('/:homeId', createRoom);
router.get('/:homeId', getRoomsByHome); // Get rooms assigned to the user
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

export default router;
