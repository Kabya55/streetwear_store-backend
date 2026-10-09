import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { verifySession, requireAdminOrEditor } from '../middleware/auth.js';

const router = express.Router();

// Public: customer checkout & cart can fetch active delivery charge
router.get('/', getSettings);
router.get('/delivery-charge', getSettings);

// Admin & Editor: edit and update delivery charge
router.patch('/', verifySession, requireAdminOrEditor, updateSettings);
router.put('/', verifySession, requireAdminOrEditor, updateSettings);
router.post('/', verifySession, requireAdminOrEditor, updateSettings);

export default router;
