import { Router } from 'express';
import { listUOM } from '../controllers/productController';

const router = Router();

// GET /api/v1/uom — all units of measure (for dropdowns)
router.get('/', listUOM);

export default router;
