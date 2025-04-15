import express from 'express';
import { createRoom, getRoomsByHome } from '../controllers/roomController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', createRoom);
router.get('/:homeId', getRoomsByHome);

export default router;
