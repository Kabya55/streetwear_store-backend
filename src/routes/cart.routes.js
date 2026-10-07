import express from 'express';
import {
  getCart,
  syncCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  calculateCart,
} from '../controllers/cart.controller.js';
import { verifySession } from '../middleware/auth.js';

const router = express.Router();

// Public: calculate server-authoritative totals (no login needed for cart preview)
router.post('/calculate', calculateCart);

// All other cart routes require active user session
router.use(verifySession);

router.get('/', getCart);
router.post('/sync', syncCart);
router.post('/', addToCart);
router.put('/', updateCartItem);
router.delete('/item', removeCartItem);
router.delete('/', clearCart);

export default router;
