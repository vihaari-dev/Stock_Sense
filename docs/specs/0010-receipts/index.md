# 0010. Receipts

**Date**: 2026-09-26
**Status**: In Progress

## Summary

The Receipts feature allows inventory managers and warehouse staff to record incoming goods. A receipt document acts as the vehicle for planning and executing an inbound stock movement. It goes through a state machine (draft -> ready -> done) and only impacts live inventory when transitioned to "done", at which point it calls the Stock Engine (`applyReceipt`) to atomically increase stock levels and write a ledger entry.

## Requirements

**Acceptance criteria**:
- **AC-1**: Users can view a list of receipts (Kanban/List view) showing reference, status, warehouse, contact, and scheduled date.
- **AC-2**: Users can create a draft receipt, selecting a destination warehouse (and optionally a location), a contact (supplier), and a scheduled date. The `responsible_user_id` defaults to the currently logged-in user. The system auto-generates a document reference like `<WH-CODE>-RCP-<ID>`.
- **AC-3**: Users can add, edit, or remove products (lines) on a draft/ready receipt, specifying `qty_expected`.
- **AC-4**: Users can record `qty_received` when the goods actually arrive.
- **AC-5**: Users can transition the receipt from `draft` to `ready`, and from `ready` to `done`.
- **AC-6**: When marked `done`, the system calls `stockEngine.applyReceipt` to permanently increase the stock in the specified location for all received products based on `qty_received`. 
- **AC-7**: A receipt marked `done` becomes immutable (locked). It cannot be transitioned back to draft.
- **AC-8**: (Degraded UI for missing dependencies): Since Products and Warehouses are not fully built out with their own UIs yet, the API will tolerate raw IDs if necessary, or the UI will gracefully degrade to empty dropdowns until those master records exist in the database.

## Decision

**Chosen option**: Standard Express API + React SPA UI.

We will use the predefined `receipts`, `receipt_lines`, and `contacts` database tables. The backend will enforce the state machine. The frontend will have a list view and a detail view. The detail view is where lines are added and quantities received are logged.

## Feature design

**Data model**:
- `receipts`: `id`, `reference`, `warehouse_id`, `destination_location_id`, `contact_id`, `responsible_user_id`, `status` (`draft`, `ready`, `done`, `canceled`), `scheduled_date`, `notes`.
- `receipt_lines`: `id`, `receipt_id`, `product_id`, `qty_expected`, `qty_received`, `unit_cost`.
- `contacts`: `id`, `name`, `type` (`supplier`).

**API / Routes**:
- `GET /api/v1/receipts`
- `GET /api/v1/receipts/:id`
- `POST /api/v1/receipts`
- `PATCH /api/v1/receipts/:id` (Update header)
- `POST /api/v1/receipts/:id/lines` (Add/update line)
- `DELETE /api/v1/receipts/:id/lines/:lineId`
- `POST /api/v1/receipts/:id/validate` (Transition to `done` and apply stock)

## Build plan

1. Backend: Build `Receipt`, `ReceiptLine`, and `Contact` Sequelize models (if not present).
2. Backend: Build `receiptService.ts` containing CRUD logic, reference number generation, and the `validateReceipt` method that calls `stockEngine.applyReceipt`.
3. Backend: Build `receiptController.ts` and `routes/receipts.ts`.
4. Frontend: Build types (`types/receipt.ts`) and API client (`api/receipts.ts`).
5. Frontend: Build `ReceiptsList.tsx` and `ReceiptDetail.tsx`.
6. Frontend: Add a "Receipts" link to the Sidebar/Dashboard header.

## Consequences

**Positive**:
- Establishes the first full operational document workflow.
- Proves the integration with the Stock Engine.

**Negative / tradeoffs**:
- Master data (Products, Warehouses, Locations, Contacts) is missing UI. We must either manually seed database records to test it or tolerate an empty UI until Features 4, 6, and 7 are built.
