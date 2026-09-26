# 0008. Stock Engine and Stock Ledger

**Date**: 2026-09-26
**Status**: In Progress

## Summary

The Stock Engine is the central backend business logic layer that guarantees inventory correctness. It enforces the primary invariant: **no stock level is ever mutated silently**. Every change to a stock quantity must be accompanied by an append-only ledger entry representing the movement, committed in the exact same database transaction. The stock engine provides atomic operations for the four core inventory actions: Receipt (increase), Delivery (decrease), Transfer (location change), and Adjustment (reconciliation). 

This feature is backend-only. It provides the service layer that the future operational document routes (receipts, deliveries, etc.) will call when those documents transition to the "done" state.

## Requirements

**Acceptance criteria**:
- **AC-1**: The engine provides an `applyReceipt` function that takes a list of products, quantities, unit costs, location, and the source document reference. It atomically increases `on_hand` in `stock_levels` and writes to `stock_ledger_entries`.
- **AC-2**: The engine provides an `applyDelivery` function that atomically decreases `on_hand` and writes to the ledger. It must enforce that `on_hand` does not fall below 0.
- **AC-3**: The engine provides an `applyTransfer` function that atomically decreases `on_hand` at the source location, increases it at the destination location, and writes two ledger entries (transfer_out and transfer_in) or one combined entry. Total quantity across the system must remain unchanged.
- **AC-4**: The engine provides an `applyAdjustment` function that applies a calculated delta (positive or negative) to reconcile a physical count, writing an adjustment entry to the ledger.
- **AC-5**: All operations must execute within a Sequelize transaction. If any part fails (e.g., negative stock constraint violation), the entire operation rolls back.
- **AC-6**: If a `stock_levels` row does not exist for a given `product_id` and `location_id` during a positive stock movement, the row is created automatically (Upsert behavior).

## Decision

**Chosen option**: Raw SQL within Sequelize Transactions.

While Sequelize Models can handle this, raw SQL using `INSERT ... ON DUPLICATE KEY UPDATE` (for stock levels) and standard `INSERT` (for the ledger) inside a managed transaction guarantees absolute control over locking and atomic execution without race conditions from the ORM's read-then-write lifecycle. 

The engine will be a single service file `server/src/services/stockEngine.ts` exposing the transactional functions.

## Feature design

**Data model**:
Uses the existing schemas from foundation:
- `stock_levels (id, product_id, location_id, on_hand, reserved, created_at, updated_at)`
- `stock_ledger_entries (id, product_id, location_id, operation_type, document_type, document_id, document_reference, qty_delta, qty_after, unit_cost_snapshot, performed_by, occurred_at)`

**API / Functions**:
```typescript
interface MovementLine {
  productId: number;
  qty: number;
  unitCost: number;
}

export async function applyReceipt(
  locationId: number,
  documentId: number,
  documentReference: string,
  lines: MovementLine[],
  performedBy: number,
  transaction?: Transaction
): Promise<void>;

// Similar functions for Delivery, Transfer, and Adjustment...
```

**Key invariants**:
- **Atomic Writes**: A `stock_levels` update and `stock_ledger_entries` insert must share a `Transaction`.
- **Non-negative Stock**: Database constraints (`chk_stock_levels_on_hand`) will reject negative stock. The engine will catch these constraint errors and throw a clean business error (`AppError`).
- **Upsert**: Receipts and Transfers-in must create the `stock_levels` row if it doesn't exist, starting from 0 before adding the quantity.

## Build plan

1. Create `server/src/services/stockEngine.ts`.
2. Implement `executeMovement` private helper that handles the `ON DUPLICATE KEY UPDATE` for `stock_levels` and returns the new `on_hand` quantity.
3. Implement `applyReceipt`, `applyDelivery`, `applyTransfer`, `applyAdjustment` using `executeMovement`.
4. Wrap all operations in Sequelize transactions.
5. Map Sequelize constraint errors to `AppError` when a delivery would cause negative stock.

## Consequences

**Positive**:
- Guarantees 100% auditability for all future inventory features.
- Centralizes the locking and race-condition prevention logic.

**Negative / tradeoffs**:
- Future features (Receipts, Deliveries) *must* remember to call these engine functions instead of updating stock manually. This requires developer discipline.

## Follow-up
- Features 10, 11, 12, 13 (Receipts, Deliveries, Transfers, Adjustments) will consume these functions when their "Validate" / "Done" actions are triggered.
- Feature 9 (Stock page) will read directly from `stock_levels`.
- Feature 14 (Move history) will read directly from `stock_ledger_entries`.
