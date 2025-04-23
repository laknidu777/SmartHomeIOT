import express from 'express';
import { registerHub } from '../controllers/hubController.js';
const router = express.Router();

router.post('/register', registerHub);

export default router;
