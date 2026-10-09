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
import { verifySession, requireAdminOrEditor } from '../middleware/auth.js';

const router = express.Router();

// Filter & categories metadata routes (must be before /:id)
router.get('/filters', getProductFilters);
router.get('/categories', getCategories);
router.post('/categories', verifySession, requireAdminOrEditor, createCategory);

// Products CRUD routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verifySession, requireAdminOrEditor, createProduct);
router.put('/:id', verifySession, requireAdminOrEditor, updateProduct);
router.delete('/:id', verifySession, requireAdminOrEditor, deleteProduct);

export default router;
