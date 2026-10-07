import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('[Vercel Serverless Error] MongoDB Connection Failed:', error);
    return res.status(500).json({
      message: 'Failed to connect to MongoDB database',
      error: error.message,
    });
  }
  return app(req, res);
}
