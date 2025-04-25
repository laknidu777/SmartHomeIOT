import express from 'express';
import { createHome, getHomes } from '../controllers/homeControllers.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate); // all routes below require auth
router.post('/', createHome);
router.get('/', getHomes);

export default router;
