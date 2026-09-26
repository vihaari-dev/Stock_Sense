import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../config/database';
import { Errors } from '../middleware/errorHandler';
import { Location } from '../models/Location';
import { Warehouse } from '../models/Warehouse';

export type LocationActiveFilter = boolean | 'all';

export interface LocationListFilters {
  page: number;
  limit: number;
  search?: string;
  warehouseId?: number;
  isActive: LocationActiveFilter;
}

interface RawLocationListRow {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  isActive: number | boolean;
  warehouseName: string;
  warehouseCode: string;
  warehouseIsActive: number | boolean;
  isAvailable: number | boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RawStockSummaryRow {
  productId: string;
  sku: string;
  productName: string;
  onHand: number;
  reserved: number;
  freeToUse: number;
}

interface RawLocationDetailRow extends RawLocationListRow {}

export interface LocationPatch {
  name?: string;
  code?: string;
  isActive?: boolean;
}

function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1;
}

function mapLocationRow(row: RawLocationListRow) {
  return {
    id: Number(row.id),
    warehouseId: Number(row.warehouseId),
    name: row.name,
    code: row.code,
    isActive: toBoolean(row.isActive),
    warehouseName: row.warehouseName,
    warehouseCode: row.warehouseCode,
    warehouseIsActive: toBoolean(row.warehouseIsActive),
    isAvailable: toBoolean(row.isAvailable),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listLocations(
  filters: LocationListFilters,
): Promise<{ rows: ReturnType<typeof mapLocationRow>[]; total: number }> {
  const conditions: string[] = [];
  const replacements: Record<string, string | number> = {
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
  };

  if (filters.isActive !== 'all') {
    conditions.push('l.is_active = :isActive');
    replacements.isActive = filters.isActive ? 1 : 0;
  }
  if (filters.warehouseId !== undefined) {
    conditions.push('l.warehouse_id = :warehouseId');
    replacements.warehouseId = filters.warehouseId;
  }
  if (filters.search) {
    conditions.push('(l.name LIKE :search OR l.code LIKE :search)');
    replacements.search = `%${filters.search}%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows, countRows] = await Promise.all([
    sequelize.query<RawLocationListRow>(
      `SELECT
         l.id,
         l.warehouse_id AS warehouseId,
         l.name,
         l.code,
         l.is_active AS isActive,
         w.name AS warehouseName,
         w.code AS warehouseCode,
         w.is_active AS warehouseIsActive,
         CASE WHEN l.is_active = 1 AND w.is_active = 1 THEN 1 ELSE 0 END AS isAvailable,
         l.created_at AS createdAt,
         l.updated_at AS updatedAt
       FROM locations l
       INNER JOIN warehouses w ON w.id = l.warehouse_id
       ${where}
       ORDER BY w.name, l.code, l.id
       LIMIT :limit OFFSET :offset`,
      { type: QueryTypes.SELECT, replacements },
    ),
    sequelize.query<{ total: number | string }>(
      `SELECT COUNT(*) AS total
       FROM locations l
       INNER JOIN warehouses w ON w.id = l.warehouse_id
       ${where}`,
      {
        type: QueryTypes.SELECT,
        replacements: Object.fromEntries(
          Object.entries(replacements).filter(([key]) => key !== 'limit' && key !== 'offset'),
        ),
      },
    ),
  ]);

  return {
    rows: rows.map(mapLocationRow),
    total: Number(countRows[0]?.total ?? 0),
  };
}

export async function getLocationById(id: number) {
  const rows = await sequelize.query<RawLocationDetailRow>(
    `SELECT
       l.id,
       l.warehouse_id AS warehouseId,
       l.name,
       l.code,
       l.is_active AS isActive,
       w.name AS warehouseName,
       w.code AS warehouseCode,
       w.is_active AS warehouseIsActive,
       CASE WHEN l.is_active = 1 AND w.is_active = 1 THEN 1 ELSE 0 END AS isAvailable,
       l.created_at AS createdAt,
       l.updated_at AS updatedAt
     FROM locations l
     INNER JOIN warehouses w ON w.id = l.warehouse_id
     WHERE l.id = :id`,
    { type: QueryTypes.SELECT, replacements: { id } },
  );

  const location = rows[0];
  if (!location) throw Errors.notFound('Location');

  const stockRows = await sequelize.query<RawStockSummaryRow>(
    `SELECT
       sl.product_id AS productId,
       p.sku,
       p.name AS productName,
       sl.on_hand AS onHand,
       sl.reserved,
       sl.on_hand - sl.reserved AS freeToUse
     FROM stock_levels sl
     INNER JOIN products p ON p.id = sl.product_id
     WHERE sl.location_id = :id AND sl.on_hand > 0
     ORDER BY p.sku`,
    { type: QueryTypes.SELECT, replacements: { id } },
  );

  const stockSummary = stockRows.map((row) => ({
    productId: Number(row.productId),
    sku: row.sku,
    productName: row.productName,
    onHand: Number(row.onHand),
    reserved: Number(row.reserved),
    freeToUse: Number(row.freeToUse),
  }));

  return { ...mapLocationRow(location), stockSummary };
}

export async function createLocation(input: {
  warehouseId: number;
  name: string;
  code: string;
}): Promise<Awaited<ReturnType<typeof getLocationById>>> {
  const locationId = await sequelize.transaction(async (transaction) => {
    const warehouse = await Warehouse.findByPk(input.warehouseId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!warehouse) throw Errors.notFound('Warehouse');
    if (!warehouse.is_active) {
      throw Errors.businessRule('Choose an active warehouse.', { code: 'WAREHOUSE_INACTIVE' });
    }

    const location = await Location.create(
      {
        warehouse_id: input.warehouseId,
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        is_active: true,
      },
      { transaction },
    );
    return Number(location.id);
  });

  return getLocationById(locationId);
}

export async function updateLocation(id: number, patch: LocationPatch): Promise<Awaited<ReturnType<typeof getLocationById>>> {
  const locationId = await sequelize.transaction(async (transaction) => {
    const location = await Location.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!location) throw Errors.notFound('Location');

    const nextName = patch.name?.trim();
    const nextCode = patch.code?.trim().toUpperCase();
    const labelChanges =
      (nextName !== undefined && nextName !== location.name) ||
      (nextCode !== undefined && nextCode !== location.code);

    if (labelChanges) await assertLabelsEditable(location.id, transaction);
    if (patch.isActive === true) await assertWarehouseActive(location.warehouse_id, transaction);
    if (patch.isActive === false) await assertCanDeactivate(location.id, transaction);

    if (nextName !== undefined) location.name = nextName;
    if (nextCode !== undefined) location.code = nextCode;
    if (patch.isActive !== undefined) location.is_active = patch.isActive;
    location.setDataValue('updated_at', new Date());
    await location.save({ transaction });
    return Number(location.id);
  });

  return getLocationById(locationId);
}

async function assertWarehouseActive(warehouseId: number, transaction: Transaction): Promise<void> {
  const warehouse = await Warehouse.findByPk(warehouseId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!warehouse) throw Errors.notFound('Warehouse');
  if (!warehouse.is_active) {
    throw Errors.businessRule('Choose an active warehouse.', { code: 'WAREHOUSE_INACTIVE' });
  }
}

async function assertLabelsEditable(
  locationId: number,
  transaction: Transaction,
): Promise<void> {
  const entries = await sequelize.query<{ id: string }>(
    'SELECT id FROM stock_ledger_entries WHERE location_id = :locationId LIMIT 1',
    { type: QueryTypes.SELECT, replacements: { locationId }, transaction },
  );
  if (entries.length > 0) {
    throw Errors.businessRule('Location name and code cannot change after a stock movement.', {
      code: 'LOCATION_LABEL_LOCKED',
    });
  }
}

async function assertCanDeactivate(
  locationId: number,
  transaction: Transaction,
): Promise<void> {
  const stock = await sequelize.query<{
    productId: string;
    sku: string;
    productName: string;
    onHand: number;
    reserved: number;
  }>(
    `SELECT sl.product_id AS productId, p.sku, p.name AS productName,
            sl.on_hand AS onHand, sl.reserved
     FROM stock_levels sl
     INNER JOIN products p ON p.id = sl.product_id
     WHERE sl.location_id = :locationId AND (sl.on_hand <> 0 OR sl.reserved <> 0)
     ORDER BY p.sku`,
    { type: QueryTypes.SELECT, replacements: { locationId }, transaction },
  );
  const openDocuments = await sequelize.query<{
    documentType: string;
    id: string;
    reference: string;
    status: string;
  }>(
    `SELECT documentType, id, reference, status
     FROM (
       SELECT 'receipt' AS documentType, id, reference, status
       FROM receipts
       WHERE destination_location_id = :locationId AND status IN ('draft', 'ready')
       UNION ALL
       SELECT 'delivery' AS documentType, id, reference, status
       FROM deliveries
       WHERE source_location_id = :locationId AND status IN ('draft', 'waiting', 'ready')
       UNION ALL
       SELECT 'transfer' AS documentType, id, reference, status
       FROM transfers
       WHERE (source_location_id = :locationId OR destination_location_id = :locationId)
         AND status IN ('draft', 'ready')
       UNION ALL
       SELECT 'adjustment' AS documentType, id, reference, status
       FROM adjustments
       WHERE location_id = :locationId AND status = 'draft'
     ) AS blockers
     ORDER BY documentType, reference`,
    { type: QueryTypes.SELECT, replacements: { locationId }, transaction },
  );

  if (stock.length > 0 || openDocuments.length > 0) {
    throw Errors.businessRule('Clear stock and open documents before deactivating this location.', {
      code: 'LOCATION_IN_USE',
      stock: stock.map((row) => ({
        productId: Number(row.productId),
        sku: row.sku,
        productName: row.productName,
        onHand: Number(row.onHand),
        reserved: Number(row.reserved),
      })),
      openDocuments: openDocuments.map((row) => ({
        documentType: row.documentType,
        id: Number(row.id),
        reference: row.reference,
        status: row.status,
      })),
    });
  }
}
