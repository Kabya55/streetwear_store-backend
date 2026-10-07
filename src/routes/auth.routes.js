import express from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import { verifySession } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifySession, getMe);
router.post('/logout', logout);

export default router;
