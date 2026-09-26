import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op, literal } from 'sequelize';
import { sequelize } from '../config/database';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { UnitOfMeasure } from '../models/UnitOfMeasure';
import { StockLevel } from '../models/StockLevel';
import { Location } from '../models/Location';
import { Warehouse } from '../models/Warehouse';
import { Errors } from '../middleware/errorHandler';

// ── Helper ──────────────────────────────────────────────────────────────────

function handleValidationErrors(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw Errors.badRequest('Validation failed', { fields: errors.array() });
  }
}

// ── Products ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/products
 * List products with pagination, search, and filters.
 */
export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    handleValidationErrors(req);

    const page    = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit   = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset  = (page - 1) * limit;
    const search  = (req.query.search as string | undefined)?.trim();
    const catId   = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;
    const isActiveRaw = req.query.is_active as string | undefined;

    const where: Record<string, unknown> = {};

    if (search) {
      where[Op.or as unknown as string] = [
        { sku:  { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
      ];
    }
    if (catId) {
      where.category_id = catId;
    }
    if (isActiveRaw !== undefined) {
      where.is_active = isActiveRaw === 'true' || isActiveRaw === '1' ? 1 : 0;
    }

    // Aggregate on_hand per product via raw subquery for efficiency
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: UnitOfMeasure, as: 'uom', attributes: ['id', 'name', 'abbreviation'] },
      ],
      attributes: {
        include: [
          [
            literal(`(
              SELECT COALESCE(SUM(sl.on_hand), 0)
              FROM stock_levels sl
              WHERE sl.product_id = Product.id
            )`),
            'total_on_hand',
          ],
        ],
      },
      order: [['name', 'ASC']],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/products/:id
 * Get a single product by ID.
 */
export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: UnitOfMeasure, as: 'uom', attributes: ['id', 'name', 'abbreviation'] },
      ],
    });
    if (!product) throw Errors.notFound('Product');
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/products
 * Create a new product. Inventory managers only.
 */
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    handleValidationErrors(req);

    const { sku, name, description, category_id, uom_id, unit_cost, reorder_point, reorder_qty } = req.body;

    // Check SKU uniqueness
    const existing = await Product.findOne({ where: { sku } });
    if (existing) throw Errors.conflict(`SKU '${sku}' is already in use.`);

    const product = await Product.create({
      sku,
      name,
      description: description ?? null,
      category_id,
      uom_id,
      unit_cost: parseFloat(unit_cost) || 0,
      reorder_point: parseInt(reorder_point) || 0,
      reorder_qty: parseInt(reorder_qty) || 0,
      is_active: 1,
    });

    const full = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: UnitOfMeasure, as: 'uom', attributes: ['id', 'name', 'abbreviation'] },
      ],
    });

    res.status(201).json({ data: full });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/products/:id
 * Update an existing product. Inventory managers only.
 */
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    handleValidationErrors(req);

    const product = await Product.findByPk(req.params.id);
    if (!product) throw Errors.notFound('Product');

    const { sku, name, description, category_id, uom_id, unit_cost, reorder_point, reorder_qty, is_active } = req.body;

    // SKU uniqueness check against OTHER products
    if (sku && sku !== product.sku) {
      const duplicate = await Product.findOne({ where: { sku, id: { [Op.ne]: product.id } } });
      if (duplicate) throw Errors.conflict(`SKU '${sku}' is already in use by another product.`);
    }

    await product.update({
      ...(sku           !== undefined ? { sku }           : {}),
      ...(name          !== undefined ? { name }          : {}),
      ...(description   !== undefined ? { description }   : {}),
      ...(category_id   !== undefined ? { category_id }   : {}),
      ...(uom_id        !== undefined ? { uom_id }        : {}),
      ...(unit_cost     !== undefined ? { unit_cost: parseFloat(unit_cost) } : {}),
      ...(reorder_point !== undefined ? { reorder_point: parseInt(reorder_point) } : {}),
      ...(reorder_qty   !== undefined ? { reorder_qty: parseInt(reorder_qty) } : {}),
      ...(is_active     !== undefined ? { is_active: is_active ? 1 : 0 } : {}),
    });

    const full = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: UnitOfMeasure, as: 'uom', attributes: ['id', 'name', 'abbreviation'] },
      ],
    });

    res.json({ data: full });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/products/:id  (soft delete — sets is_active = 0)
 * Inventory managers only.
 */
export async function deactivateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw Errors.notFound('Product');
    await product.update({ is_active: 0 });
    res.json({ data: { message: 'Product deactivated successfully.' } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/products/:id/stock
 * Per-location stock breakdown for a product.
 */
export async function getProductStock(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw Errors.notFound('Product');

    const stockLevels = await StockLevel.findAll({
      where: { product_id: product.id },
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'code'],
          include: [
            { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] },
          ],
        },
      ],
      order: [[{ model: Location, as: 'location' }, 'name', 'ASC']],
    });

    const rows = stockLevels.map((sl) => ({
      location_id:  sl.location_id,
      location:     (sl as any).location,
      on_hand:      sl.on_hand,
      reserved:     sl.reserved,
      free_to_use:  sl.on_hand - sl.reserved,
    }));

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

// ── Categories ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/categories
 * Return all categories (for dropdown selectors).
 */
export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
    });
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

// ── Units of Measure ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/uom
 * Return all units of measure (for dropdown selectors).
 */
export async function listUOM(_req: Request, res: Response, next: NextFunction) {
  try {
    const uoms = await UnitOfMeasure.findAll({
      order: [['name', 'ASC']],
    });
    res.json({ data: uoms });
  } catch (err) {
    next(err);
  }
}
