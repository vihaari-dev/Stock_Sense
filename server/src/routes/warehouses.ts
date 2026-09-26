import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/requireAuth';
import { createWarehouse, getWarehouses, getWarehouseById, updateWarehouse } from '../controllers/warehouse';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors.array(),
      },
    });
  }
  next();
};

router.use(requireAuth);

router.post(
  '/',
  requireRole('inventory_manager'),
  [
    body('name').trim().notEmpty().withMessage('Warehouse name is required'),
    body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Code must be 2-10 characters').toUpperCase(),
    body('address').optional().trim(),
  ],
  validate,
  createWarehouse
);

router.get(
  '/',
  requireRole('inventory_manager', 'warehouse_staff'),
  getWarehouses
);

router.get(
  '/:id',
  requireRole('inventory_manager', 'warehouse_staff'),
  getWarehouseById
);

router.put(
  '/:id',
  requireRole('inventory_manager'),
  [
    body('name').optional().trim().notEmpty().withMessage('Warehouse name cannot be empty'),
    body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Code must be 2-10 characters').toUpperCase(),
    body('address').optional().trim(),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  ],
  validate,
  updateWarehouse
);

export default router;
