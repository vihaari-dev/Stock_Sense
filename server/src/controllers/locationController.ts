import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Errors } from '../middleware/errorHandler';
import {
  createLocation,
  getLocationById,
  listLocations,
  updateLocation,
} from '../services/locationService';

function validate(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(Errors.badRequest('Validation failed.', { fields: errors.array() }));
  }
  next();
}

export const validateLocationList = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim().isLength({ max: 100 }),
  query('warehouseId').optional().isInt({ min: 1 }).toInt(),
  query('isActive').optional().isIn(['true', 'false', 'all']),
  validate,
];

export const validateLocationId = [
  param('id').isInt({ min: 1 }).toInt(),
  validate,
];

export const validateLocationCreate = [
  body('warehouseId').isInt({ min: 1 }).toInt(),
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 150 }),
  body('code').trim().notEmpty().withMessage('code is required').isLength({ max: 20 }),
  body().custom((value) => !Object.prototype.hasOwnProperty.call(value ?? {}, 'isActive'))
    .withMessage('isActive is assigned when the location is created.'),
  validate,
];

export const validateLocationUpdate = [
  param('id').isInt({ min: 1 }).toInt(),
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('code').optional().trim().notEmpty().isLength({ max: 20 }),
  body('isActive').optional().isBoolean({ strict: true }).toBoolean(),
  body().custom((value) => !Object.prototype.hasOwnProperty.call(value ?? {}, 'warehouseId'))
    .withMessage('warehouseId cannot be changed.'),
  body().custom((value) => ['name', 'code', 'isActive'].some((key) => value?.[key] !== undefined))
    .withMessage('At least one supported field is required.'),
  validate,
];

export async function listLocationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = (req.query.page as unknown as number) || 1;
    const limit = (req.query.limit as unknown as number) || 20;
    const isActiveQuery = req.query.isActive as string | undefined;
    const isActive = isActiveQuery === undefined ? true : isActiveQuery === 'all' ? 'all' : isActiveQuery === 'true';
    const warehouseId = req.query.warehouseId as unknown as number | undefined;
    const search = req.query.search as string | undefined;
    const result = await listLocations({ page, limit, search, warehouseId, isActive });

    res.json({
      data: result.rows,
      meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLocationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const location = await getLocationById(Number(req.params.id));
    res.json(location);
  } catch (err) {
    next(err);
  }
}

export async function createLocationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const location = await createLocation({
      warehouseId: Number(req.body.warehouseId),
      name: req.body.name,
      code: req.body.code,
    });
    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
}

export async function updateLocationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patch: { name?: string; code?: string; isActive?: boolean } = {};
    if (req.body.name !== undefined) patch.name = req.body.name;
    if (req.body.code !== undefined) patch.code = req.body.code;
    if (req.body.isActive !== undefined) patch.isActive = req.body.isActive;
    const location = await updateLocation(Number(req.params.id), patch);
    res.json(location);
  } catch (err) {
    next(err);
  }
}
