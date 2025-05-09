import express from 'express';
import { sendInviteCode,verifyInviteCode } from '../controllers/inviteController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send-code', authenticate, sendInviteCode);
router.post('/verify', authenticate, verifyInviteCode);

export default router;
