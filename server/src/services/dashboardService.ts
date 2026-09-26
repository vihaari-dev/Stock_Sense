import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

export interface KpiPayload {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
  waitingOperations: number;
}

interface CountRow { cnt: string }

function toInt(row: CountRow | undefined): number {
  return parseInt(row?.cnt ?? '0', 10);
}

/**
 * getDashboardKpis — runs seven COUNT aggregation queries against existing tables
 * and returns all KPI values in one payload. No data is mutated.
 *
 * Satisfies AC-1, AC-2, AC-3 of spec 0002.
 */
export async function getDashboardKpis(): Promise<KpiPayload> {
  const [
    totalProductsRows,
    lowStockRows,
    outOfStockRows,
    pendingReceiptsRows,
    pendingDeliveriesRows,
    scheduledTransfersRows,
    waitingOperationsRows,
  ] = await Promise.all([
    sequelize.query<CountRow>(
      `SELECT COUNT(*) AS cnt FROM products WHERE is_active = 1`,
      { type: QueryTypes.SELECT },
    ),
    sequelize.query<CountRow>(
      `SELECT COUNT(DISTINCT sl.product_id) AS cnt
       FROM stock_levels sl
       JOIN products p ON p.id = sl.product_id
       WHERE p.is_active = 1
         AND sl.on_hand > 0
         AND sl.on_hand <= p.reorder_point`,
      { type: QueryTypes.SELECT },
    ),
    sequelize.query<CountRow>(
      `SELECT COUNT(*) AS cnt FROM (
         SELECT p.id
         FROM products p
         LEFT JOIN stock_levels sl ON sl.product_id = p.id
         WHERE p.is_active = 1
         GROUP BY p.id
         HAVING COALESCE(SUM(sl.on_hand), 0) = 0
       ) AS out_of_stock`,
      { type: QueryTypes.SELECT },
    ),
    sequelize.query<CountRow>(
      `SELECT COUNT(*) AS cnt FROM receipts WHERE status IN ('draft','ready')`,
      { type: QueryTypes.SELECT },
    ),
    sequelize.query<CountRow>(
      `SELECT COUNT(*) AS cnt FROM deliveries WHERE status IN ('draft','waiting','ready')`,
      { type: QueryTypes.SELECT },
    ),
    sequelize.query<CountRow>(
      `SELECT COUNT(*) AS cnt FROM transfers WHERE status IN ('draft','ready')`,
      { type: QueryTypes.SELECT },
    ),
    sequelize.query<CountRow>(
      `SELECT COUNT(*) AS cnt FROM deliveries WHERE status = 'waiting'`,
      { type: QueryTypes.SELECT },
    ),
  ]);

  return {
    totalProducts:      toInt(totalProductsRows[0]),
    lowStockItems:      toInt(lowStockRows[0]),
    outOfStockItems:    toInt(outOfStockRows[0]),
    pendingReceipts:    toInt(pendingReceiptsRows[0]),
    pendingDeliveries:  toInt(pendingDeliveriesRows[0]),
    scheduledTransfers: toInt(scheduledTransfersRows[0]),
    waitingOperations:  toInt(waitingOperationsRows[0]),
  };
}
