import express from 'express';
import { createRoom, getRoomsByHome,updateRoom,deleteRoom } from '../controllers/roomController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', createRoom);
router.get('/:homeId', getRoomsByHome);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

export default router;
