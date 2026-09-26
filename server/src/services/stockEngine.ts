import { Transaction, QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { AppError, Errors } from '../middleware/errorHandler';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MovementLine {
  productId: number;
  qty: number;
  unitCost: number; // for receipts/adjustments; deliveries might just inherit current cost
}

export type OperationType = 'receipt' | 'delivery' | 'transfer_out' | 'transfer_in' | 'adjustment' | 'initial';
export type DocumentType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';

interface MovementContext {
  documentId: number;
  documentType: DocumentType;
  documentReference: string;
  performedBy: number;
}

// ── Core Engine ───────────────────────────────────────────────────────────────

/**
 * Applies a stock movement atomically:
 * 1. Upserts the stock_levels table (adding or subtracting qty).
 * 2. Fetches the resulting on_hand.
 * 3. Appends a ledger entry.
 */
async function executeMovement(
  locationId: number,
  line: MovementLine,
  operationType: OperationType,
  context: MovementContext,
  transaction: Transaction
): Promise<void> {
  const { productId, qty, unitCost } = line;
  
  if (qty === 0) return; // No zero-qty movements recorded

  try {
    // 1. Update stock levels using ON DUPLICATE KEY UPDATE.
    // If the row doesn't exist, it inserts with on_hand = qty.
    // If it exists, it adds the qty (which can be negative for deliveries).
    await sequelize.query(
      `INSERT INTO stock_levels (product_id, location_id, on_hand, reserved, created_at, updated_at)
       VALUES (:productId, :locationId, :qty, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE 
         on_hand = on_hand + :qty,
         updated_at = NOW()`,
      {
        replacements: { productId, locationId, qty },
        type: QueryTypes.INSERT,
        transaction,
      }
    );

    // 2. Read back the updated quantity to store in the ledger.
    // This is safe within the same transaction (InnoDB row lock).
    const [row] = await sequelize.query<{ on_hand: number }>(
      `SELECT on_hand FROM stock_levels WHERE product_id = :productId AND location_id = :locationId LIMIT 1`,
      {
        replacements: { productId, locationId },
        type: QueryTypes.SELECT,
        transaction,
      }
    );

    if (!row) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Stock level row disappeared during transaction.');
    }

    // 3. Append to the ledger
    await sequelize.query(
      `INSERT INTO stock_ledger_entries (
         product_id, location_id, operation_type, document_type, document_id, 
         document_reference, qty_delta, qty_after, unit_cost_snapshot, performed_by, occurred_at
       ) VALUES (
         :productId, :locationId, :operationType, :documentType, :documentId,
         :documentReference, :qty, :qtyAfter, :unitCost, :performedBy, NOW()
       )`,
      {
        replacements: {
          productId,
          locationId,
          operationType,
          documentType: context.documentType,
          documentId: context.documentId,
          documentReference: context.documentReference,
          qty,
          qtyAfter: row.on_hand,
          unitCost,
          performedBy: context.performedBy,
        },
        type: QueryTypes.INSERT,
        transaction,
      }
    );

  } catch (err: any) {
    // Catch MySQL CHECK constraint failures (e.g. on_hand >= 0)
    if (err.name === 'SequelizeDatabaseError' && err.message.includes('chk_stock_levels_on_hand')) {
      throw Errors.businessRule(
        `Insufficient stock for product ID ${productId} at location ID ${locationId}.`,
        { code: 'INSUFFICIENT_STOCK' }
      );
    }
    throw err;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function applyReceipt(
  locationId: number,
  lines: MovementLine[],
  context: MovementContext,
  providedTx?: Transaction
): Promise<void> {
  const run = async (tx: Transaction) => {
    for (const line of lines) {
      if (line.qty < 0) throw Errors.businessRule('Receipt quantities must be positive.');
      await executeMovement(locationId, line, 'receipt', context, tx);
    }
  };

  if (providedTx) return run(providedTx);
  return sequelize.transaction(run);
}

export async function applyDelivery(
  locationId: number,
  lines: MovementLine[],
  context: MovementContext,
  providedTx?: Transaction
): Promise<void> {
  const run = async (tx: Transaction) => {
    for (const line of lines) {
      if (line.qty < 0) throw Errors.businessRule('Delivery quantities must be represented as positive numbers (engine will negate them).');
      
      // Negate qty for delivery
      const outLine = { ...line, qty: -line.qty };
      await executeMovement(locationId, outLine, 'delivery', context, tx);
    }
  };

  if (providedTx) return run(providedTx);
  return sequelize.transaction(run);
}

export async function applyTransfer(
  sourceLocationId: number,
  destinationLocationId: number,
  lines: MovementLine[],
  context: MovementContext,
  providedTx?: Transaction
): Promise<void> {
  const run = async (tx: Transaction) => {
    for (const line of lines) {
      if (line.qty < 0) throw Errors.businessRule('Transfer quantities must be positive.');

      // 1. Decrease source
      const outLine = { ...line, qty: -line.qty };
      await executeMovement(sourceLocationId, outLine, 'transfer_out', context, tx);

      // 2. Increase destination
      await executeMovement(destinationLocationId, line, 'transfer_in', context, tx);
    }
  };

  if (providedTx) return run(providedTx);
  return sequelize.transaction(run);
}

export async function applyAdjustment(
  locationId: number,
  lines: MovementLine[],
  context: MovementContext,
  providedTx?: Transaction
): Promise<void> {
  const run = async (tx: Transaction) => {
    for (const line of lines) {
      // Adjustments provide the explicit delta (which can be positive or negative)
      await executeMovement(locationId, line, 'adjustment', context, tx);
    }
  };

  if (providedTx) return run(providedTx);
  return sequelize.transaction(run);
}
