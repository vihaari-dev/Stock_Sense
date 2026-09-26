# 0004. Warehouse Management

**Date**: 2026-09-26
**Status**: Proposed

## Summary
The system needs to manage physical or logical warehouses as first-class inventory concepts. Each warehouse has a name, a short code (used for reference generation), and an address. This spec defines the API and UI requirements for creating, viewing, updating, and managing warehouses. 

## Requirements
- **AC-1**: Users with `inventory_manager` role can create a new warehouse providing a name, short code (2-5 characters, uppercase), and address.
- **AC-2**: Users can list all warehouses in the system.
- **AC-3**: Users can update the details of an existing warehouse.
- **AC-4**: A warehouse cannot be deleted if it has associated locations or stock movements (enforced via database constraints, but API should return a human-readable error). For this phase, we will omit hard deletion and rely on `is_active` flag if deactivation is needed, but for MVP simple CRUD is sufficient.

## Decision
- **API Endpoints**:
  - `POST /api/v1/warehouses`: Create a new warehouse. (Role: `inventory_manager`)
  - `GET /api/v1/warehouses`: List all warehouses. (Role: `inventory_manager`, `warehouse_staff`)
  - `GET /api/v1/warehouses/:id`: Get warehouse details. (Role: `inventory_manager`, `warehouse_staff`)
  - `PUT /api/v1/warehouses/:id`: Update warehouse. (Role: `inventory_manager`)
- **Database Table**: `warehouses` (already existing via migrations, verify schema: `id`, `name`, `short_code`, `address`, `created_at`, `updated_at`).
- **UI Pages**:
  - `/warehouses`: List view of all warehouses.
  - `/warehouses/new`: Form to create a new warehouse.
  - `/warehouses/:id/edit`: Form to edit a warehouse.

## Build plan
1. Backend Models & Routes:
   - Verify `Warehouse` Sequelize model matches DB schema.
   - Implement `WarehouseController` with `create`, `getAll`, `getOne`, `update` methods.
   - Register routes in `server/src/routes/warehouses.ts` and mount them in `app.ts` under `/api/v1/warehouses`.
2. Frontend API & Context:
   - Create `client/src/api/warehouses.ts` to call backend endpoints.
3. Frontend UI Components:
   - Create `client/src/pages/warehouses/WarehouseList.tsx` showing a table/list of warehouses.
   - Create `client/src/pages/warehouses/WarehouseForm.tsx` for create/edit.
4. Routing:
   - Add routes `/warehouses`, `/warehouses/new`, `/warehouses/:id/edit` to `client/src/App.tsx` (Protected).

## Consequences
- Operations like Receipts and Deliveries will rely on this master data.
- The `short_code` must be unique to avoid reference collisions.

## Follow-up
- None at this time.
