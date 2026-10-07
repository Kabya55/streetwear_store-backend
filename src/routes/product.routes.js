import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  getProductFilters,
} from '../controllers/product.controller.js';
import { verifySession, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Filter & categories metadata routes (must be before /:id)
router.get('/filters', getProductFilters);
router.get('/categories', getCategories);
router.post('/categories', verifySession, requireAdmin, createCategory);

// Products CRUD routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verifySession, requireAdmin, createProduct);
router.put('/:id', verifySession, requireAdmin, updateProduct);
router.delete('/:id', verifySession, requireAdmin, deleteProduct);

export default router;
