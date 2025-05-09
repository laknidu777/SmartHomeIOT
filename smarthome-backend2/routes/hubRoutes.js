import express from 'express';
import { createHub, getHubsForHouse, updateHub,deleteHub} from '../controllers/hubController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', authenticate, createHub);
router.get('/:houseId', authenticate, getHubsForHouse);

router.patch('/:id', authenticate, updateHub);
router.delete('/:id', authenticate, deleteHub);

export default router;
