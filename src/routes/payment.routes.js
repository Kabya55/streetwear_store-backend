import express from 'express';
import {
  initPayment,
  handlePaymentSuccess,
  handlePaymentFail,
  handlePaymentCancel,
  handleIPN,
} from '../controllers/payment.controller.js';
import { verifySession } from '../middleware/auth.js';

const router = express.Router();

router.post('/init', verifySession, initPayment);

// Public callbacks from SSLCommerz (Gateway redirects using POST)
router.post('/success/:tranId', handlePaymentSuccess);
router.post('/fail/:tranId', handlePaymentFail);
router.post('/cancel/:tranId', handlePaymentCancel);
router.post('/ipn', handleIPN);

export default router;
