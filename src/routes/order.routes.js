import express from 'express';
import { createOrder, getMyOrders, getOrderById } from '../controllers/order.controller.js';
import { verifySession } from '../middleware/auth.js';

const router = express.Router();

// Protected: Only authenticated users with verified JWT session can place or view orders
router.post('/', verifySession, createOrder);
router.get('/', verifySession, getMyOrders);
router.get('/:id', verifySession, getOrderById);

export default router;
