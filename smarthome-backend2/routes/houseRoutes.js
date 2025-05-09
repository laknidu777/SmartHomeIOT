import express from 'express';
import { createHouse, getUserHouses } from '../controllers/houseController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', authenticate, createHouse);
router.get('/my-houses', authenticate, getUserHouses);


export default router;
