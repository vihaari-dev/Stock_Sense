import { Router } from 'express';
import { listCategories } from '../controllers/productController';

const router = Router();

// GET /api/v1/categories — all categories (for dropdowns)
router.get('/', listCategories);

export default router;
