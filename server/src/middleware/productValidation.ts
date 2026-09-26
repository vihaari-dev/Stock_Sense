import { body, param, query } from 'express-validator';

export const createProductValidation = [
  body('sku')
    .trim()
    .notEmpty().withMessage('SKU is required')
    .isLength({ max: 100 }).withMessage('SKU must be ≤ 100 characters'),

  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 255 }).withMessage('Name must be ≤ 255 characters'),

  body('description')
    .optional({ nullable: true })
    .isString(),

  body('category_id')
    .notEmpty().withMessage('Category is required')
    .isInt({ min: 1 }).withMessage('Invalid category'),

  body('uom_id')
    .notEmpty().withMessage('Unit of measure is required')
    .isInt({ min: 1 }).withMessage('Invalid unit of measure'),

  body('unit_cost')
    .notEmpty().withMessage('Unit cost is required')
    .isFloat({ min: 0 }).withMessage('Unit cost must be ≥ 0'),

  body('reorder_point')
    .optional()
    .isInt({ min: 0 }).withMessage('Reorder point must be ≥ 0'),

  body('reorder_qty')
    .optional()
    .isInt({ min: 0 }).withMessage('Reorder quantity must be ≥ 0'),
];

export const updateProductValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid product ID'),

  body('sku')
    .optional()
    .trim()
    .notEmpty().withMessage('SKU cannot be empty')
    .isLength({ max: 100 }).withMessage('SKU must be ≤ 100 characters'),

  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 255 }).withMessage('Name must be ≤ 255 characters'),

  body('description')
    .optional({ nullable: true })
    .isString(),

  body('category_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid category'),

  body('uom_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid unit of measure'),

  body('unit_cost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Unit cost must be ≥ 0'),

  body('reorder_point')
    .optional()
    .isInt({ min: 0 }).withMessage('Reorder point must be ≥ 0'),

  body('reorder_qty')
    .optional()
    .isInt({ min: 0 }).withMessage('Reorder quantity must be ≥ 0'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
];

export const listProductsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('category_id').optional().isInt({ min: 1 }),
  query('is_active').optional().isIn(['true', 'false', '0', '1']),
];
