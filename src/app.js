import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import cartRoutes from './routes/cart.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or SSLCommerz postbacks)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());
// SSLCommerz webhook & redirects send application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'MIRALOU Streetwear API',
    timestamp: new Date().toISOString(),
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Internal Server Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

export default app;
