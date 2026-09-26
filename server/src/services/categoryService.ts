import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { Category } from '../models/Category';
import { AppError, Errors } from '../middleware/errorHandler';

export interface CategoryRow {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;
  productCount: number;
}

export interface CategoryDetail extends CategoryRow {
  children: Array<{ id: number; name: string; productCount: number }>;
}

interface RawCategoryRow {
  id: string;
  name: string;
  parent_id: string | null;
  parent_name: string | null;
  product_count: string;
}

function mapRow(r: RawCategoryRow): CategoryRow {
  return {
    id:           parseInt(r.id, 10),
    name:         r.name,
    parentId:     r.parent_id ? parseInt(r.parent_id, 10) : null,
    parentName:   r.parent_name ?? null,
    productCount: parseInt(r.product_count, 10),
  };
}

const LIST_SQL = `
  SELECT
    c.id,
    c.name,
    c.parent_id,
    p.name  AS parent_name,
    COUNT(DISTINCT pr.id) AS product_count
  FROM categories c
  LEFT JOIN categories p  ON p.id = c.parent_id
  LEFT JOIN products  pr ON pr.category_id = c.id AND pr.is_active = 1
  GROUP BY c.id, c.name, c.parent_id, p.name
  ORDER BY c.name
  LIMIT :limit OFFSET :offset
`;

const COUNT_SQL = `SELECT COUNT(*) AS total FROM categories`;

/** List categories with pagination (AC-1) */
export async function listCategories(page: number, limit: number): Promise<{ rows: CategoryRow[]; total: number }> {
  const offset = (page - 1) * limit;
  const [rows, countRows] = await Promise.all([
    sequelize.query<RawCategoryRow>(LIST_SQL, { type: QueryTypes.SELECT, replacements: { limit, offset } }),
    sequelize.query<{ total: string }>(COUNT_SQL, { type: QueryTypes.SELECT }),
  ]);
  return { rows: rows.map(mapRow), total: parseInt(countRows[0]?.total ?? '0', 10) };
}

/** Get single category with its children (AC-3) */
export async function getCategoryById(id: number): Promise<CategoryDetail> {
  const [rows, childRows] = await Promise.all([
    sequelize.query<RawCategoryRow>(
      `SELECT c.id, c.name, c.parent_id, p.name AS parent_name,
              COUNT(DISTINCT pr.id) AS product_count
       FROM categories c
       LEFT JOIN categories p  ON p.id = c.parent_id
       LEFT JOIN products  pr ON pr.category_id = c.id AND pr.is_active = 1
       WHERE c.id = :id
       GROUP BY c.id, c.name, c.parent_id, p.name`,
      { type: QueryTypes.SELECT, replacements: { id } }
    ),
    sequelize.query<{ id: string; name: string; product_count: string }>(
      `SELECT c.id, c.name, COUNT(DISTINCT pr.id) AS product_count
       FROM categories c
       LEFT JOIN products pr ON pr.category_id = c.id AND pr.is_active = 1
       WHERE c.parent_id = :id
       GROUP BY c.id, c.name`,
      { type: QueryTypes.SELECT, replacements: { id } }
    ),
  ]);

  if (!rows[0]) throw Errors.notFound('Category');

  return {
    ...mapRow(rows[0]),
    children: childRows.map((r) => ({
      id:           parseInt(r.id, 10),
      name:         r.name,
      productCount: parseInt(r.product_count, 10),
    })),
  };
}

/** Create category (AC-2) */
export async function createCategory(name: string, parentId: number | null): Promise<CategoryRow> {
  if (parentId !== null) {
    await assertParentExists(parentId);
    await assertParentIsTopLevel(parentId);
  }

  try {
    const cat = await Category.create({ name, parent_id: parentId ?? null });
    return { id: cat.id, name: cat.name, parentId: cat.parent_id, parentName: null, productCount: 0 };
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) throw new AppError(409, 'CONFLICT', `A category named "${name}" already exists.`);
    throw err;
  }
}

/** Update category name / parent (AC-4) */
export async function updateCategory(
  id: number,
  patch: { name?: string; parentId?: number | null }
): Promise<CategoryRow> {
  const cat = await Category.findByPk(id);
  if (!cat) throw Errors.notFound('Category');

  if (patch.parentId !== undefined) {
    if (patch.parentId !== null) {
      await assertParentExists(patch.parentId);
      await assertParentIsTopLevel(patch.parentId);
      // Guard: a category cannot be its own parent
      if (patch.parentId === id) {
        throw Errors.businessRule('A category cannot be its own parent.');
      }
    }
  }

  try {
    if (patch.name !== undefined) cat.name = patch.name;
    if (patch.parentId !== undefined) cat.parent_id = patch.parentId;
    await cat.save();
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) throw new AppError(409, 'CONFLICT', `A category named "${patch.name}" already exists.`);
    throw err;
  }

  return getCategoryById(id);
}

/** Delete category if safe (AC-5) */
export async function deleteCategory(id: number): Promise<void> {
  const cat = await Category.findByPk(id);
  if (!cat) throw Errors.notFound('Category');

  // Check child categories
  const [childRows] = await sequelize.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM categories WHERE parent_id = :id`,
    { type: QueryTypes.SELECT, replacements: { id } }
  );
  if (parseInt(childRows?.cnt ?? '0', 10) > 0) {
    throw Errors.businessRule('This category has child categories and cannot be deleted.', { code: 'CATEGORY_HAS_CHILDREN' });
  }

  // Check products assigned
  const [productRows] = await sequelize.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM products WHERE category_id = :id`,
    { type: QueryTypes.SELECT, replacements: { id } }
  );
  if (parseInt(productRows?.cnt ?? '0', 10) > 0) {
    throw Errors.businessRule('This category has products assigned and cannot be deleted.', { code: 'CATEGORY_IN_USE' });
  }

  await cat.destroy();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assertParentExists(parentId: number): Promise<void> {
  const parent = await Category.findByPk(parentId);
  if (!parent) throw Errors.notFound('Parent category');
}

async function assertParentIsTopLevel(parentId: number): Promise<void> {
  const parent = await Category.findByPk(parentId);
  if (parent && parent.parent_id !== null) {
    throw Errors.businessRule('A category can only be nested one level deep. The chosen parent is already a sub-category.');
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'SequelizeUniqueConstraintError'
  );
}
