import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { verifySession, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: customer checkout & cart can fetch active delivery charge
router.get('/', getSettings);
router.get('/delivery-charge', getSettings);

// Admin only: edit and update delivery charge
router.patch('/', verifySession, requireAdmin, updateSettings);
router.put('/', verifySession, requireAdmin, updateSettings);
router.post('/', verifySession, requireAdmin, updateSettings);

export default router;
