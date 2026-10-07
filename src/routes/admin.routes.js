import express from 'express';
import {
  getAdminStats,
  getAllUsersWithOrders,
  getAllOrdersAdmin,
  updateDeliveryStatus,
} from '../controllers/admin.controller.js';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { verifySession, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Protect all admin endpoints
router.use(verifySession, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsersWithOrders);
router.get('/orders', getAllOrdersAdmin);
router.patch('/orders/:id/status', updateDeliveryStatus);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.put('/settings', updateSettings);

export default router;
