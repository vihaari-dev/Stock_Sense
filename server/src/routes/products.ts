import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
  getProductStock,
} from '../controllers/productController';
import {
  listProductsValidation,
  createProductValidation,
  updateProductValidation,
} from '../middleware/productValidation';

const router = Router();

// GET  /api/v1/products           — paginated list with search + filter
router.get('/', listProductsValidation, listProducts);

// GET  /api/v1/products/:id       — single product detail
router.get('/:id', getProduct);

// GET  /api/v1/products/:id/stock — per-location stock breakdown
router.get('/:id/stock', getProductStock);

// POST /api/v1/products           — create (inventory_manager)
router.post('/', createProductValidation, createProduct);

// PATCH /api/v1/products/:id      — update (inventory_manager)
router.patch('/:id', updateProductValidation, updateProduct);

// DELETE /api/v1/products/:id     — soft delete / deactivate (inventory_manager)
router.delete('/:id', deactivateProduct);

export default router;
