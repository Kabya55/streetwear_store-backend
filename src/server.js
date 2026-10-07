import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to DB on startup:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 MIRALOU Streetwear API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💳 SSLCommerz Sandbox: ${process.env.SSLCOMMERZ_IS_SANDBOX}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
    console.log(`===============================================`);
  });
};

startServer();
