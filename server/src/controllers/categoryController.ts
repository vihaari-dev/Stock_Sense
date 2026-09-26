import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService';
import { Errors } from '../middleware/errorHandler';

function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(Errors.badRequest('Validation failed.', { fields: errors.array() }));
  }
  next();
}

// ── Validators ────────────────────────────────────────────────────────────────

export const validateList = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
];

export const validateCreate = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 100 }),
  body('parentId').optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  validate,
];

export const validateUpdate = [
  param('id').isInt({ min: 1 }).toInt(),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('parentId').optional({ nullable: true }).custom((v) => v === null || Number.isInteger(Number(v))),
  validate,
];

export const validateId = [
  param('id').isInt({ min: 1 }).toInt(),
  validate,
];

// ── Handlers ──────────────────────────────────────────────────────────────────

/** GET /api/v1/categories */
export async function listHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page  = (req.query.page  as unknown as number) || 1;
    const limit = (req.query.limit as unknown as number) || 20;
    const { rows, total } = await listCategories(page, limit);
    res.json({
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
}

/** GET /api/v1/categories/:id */
export async function getOneHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const cat = await getCategoryById(id);
    res.json(cat);
  } catch (err) { next(err); }
}

/** POST /api/v1/categories */
export async function createHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, parentId = null } = req.body;
    const cat = await createCategory(name, parentId);
    res.status(201).json(cat);
  } catch (err) { next(err); }
}

/** PATCH /api/v1/categories/:id */
export async function updateHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const patch: { name?: string; parentId?: number | null } = {};
    if (req.body.name      !== undefined) patch.name     = req.body.name;
    if (req.body.parentId  !== undefined) patch.parentId = req.body.parentId === null ? null : parseInt(req.body.parentId, 10);
    const cat = await updateCategory(id, patch);
    res.json(cat);
  } catch (err) { next(err); }
}

/** DELETE /api/v1/categories/:id */
export async function deleteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteCategory(id);
    res.status(204).send();
  } catch (err) { next(err); }
}
