import express from 'express';
import { createHouse, getUserHouses,
    updateHouse,
  deleteHouse,getHouseById
 } from '../controllers/houseController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', authenticate, createHouse);
router.get('/my-houses', authenticate, getUserHouses);
router.put('/:homeId', authenticate, updateHouse); // ✅ SuperAdmin only
router.delete('/:homeId', authenticate, deleteHouse);
router.get('/:homeId', authenticate, getHouseById);

export default router;
