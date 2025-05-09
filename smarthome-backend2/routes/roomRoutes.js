import express from 'express';
import { createRoom,getRoomsForHouse,getRoomsWithDevices,updateRoom,deleteRoom
    
 } from '../controllers/roomController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', authenticate, createRoom);
router.get('/:houseId', authenticate, getRoomsForHouse);

router.get('/with-devices/:homeId', authenticate, getRoomsWithDevices);

router.patch('/:id', authenticate, updateRoom);
router.delete('/:id', authenticate, deleteRoom);

export default router;
