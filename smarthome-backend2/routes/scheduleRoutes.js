import express from 'express';
import { createSchedule, getSchedulesForRoom, updateSchedule,
  deleteSchedule } from '../controllers/scheduleController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, createSchedule);
router.get('/:roomId', authenticate, getSchedulesForRoom);
router.patch('/:id', authenticate, updateSchedule);
router.delete('/:id', authenticate, deleteSchedule);

export default router;
