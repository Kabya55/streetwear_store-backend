import express from 'express';
import {
  getAdminStats,
  getAllUsersWithOrders,
  getAllOrdersAdmin,
  updateDeliveryStatus,
  updatePaymentStatus,
  updateUserRole,
} from '../controllers/admin.controller.js';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { verifySession, requireAdmin, requireAdminOrEditor } from '../middleware/auth.js';

const router = express.Router();

// Base session check
router.use(verifySession);

// Stats & Orders (Accessible by Admin and Editor)
router.get('/stats', requireAdminOrEditor, getAdminStats);
router.get('/orders', requireAdminOrEditor, getAllOrdersAdmin);
router.patch('/orders/:id/status', requireAdminOrEditor, updateDeliveryStatus);
router.patch('/orders/:id/payment', requireAdminOrEditor, updatePaymentStatus);

// Settings (Read by Admin/Editor, Write by Admin only)
router.get('/settings', requireAdminOrEditor, getSettings);
router.patch('/settings', requireAdmin, updateSettings);
router.put('/settings', requireAdmin, updateSettings);

// User Management (Admin only)
router.get('/users', requireAdmin, getAllUsersWithOrders);
router.patch('/users/:id/role', requireAdmin, updateUserRole);

export default router;
