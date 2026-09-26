# 0011. Delivery orders

**Date**: 2026-09-26
**Status**: In Progress

## Summary

This specification covers the Delivery Orders module (Slice 11), an operational workflow that tracks outgoing goods from document creation through validation and completion. A delivery order represents the intent to pick and ship products from a specific source warehouse to a contact (customer or internal destination). Stock decreases only at completion, while waiting deliveries remain clearly visible but do not cause invalid negative inventory.

## Requirements

- **AC-1**: An inventory manager or warehouse staff can create a delivery order for a specific warehouse.
- **AC-2**: A delivery order must have a clear state machine: `draft` -> `waiting` (optional) -> `ready` -> `done`, or `canceled`.
- **AC-3**: Users can add, update, and remove line items containing the product and quantity requested while the order is in `draft`.
- **AC-4**: Validating an order checks stock availability. If stock is available, it moves to `ready` and reserves the stock.
- **AC-5**: Completing an order (`done`) deducts the stock from `stock_levels` and writes to the immutable `stock_ledger_entries`.
- **AC-6**: The delivery order list supports a Kanban-like grouped view by status, and allows searching by reference.
- **AC-7**: Line items visibly flag (`is_available` = false) when stock is insufficient.

## Decision

**Chosen option**: Standard REST API with React components using Axios.
The backend will implement the `deliveries` and `delivery_lines` tables already defined in the foundation schema. The controller will enforce the state machine. 

**Implementation skills**: `database-schema-designer` (for data structures), `develop` (for building the feature).

## Build plan

### 1. Backend Data Models
- Implement `Delivery` and `DeliveryLine` Sequelize models in `server/src/models/`.
- Ensure associations: Delivery has many DeliveryLines, Delivery belongs to Warehouse, Contact, User (responsible), and Location. DeliveryLine belongs to Delivery and Product.
- Register models in `server/src/models/index.ts`.

### 2. Backend Routes and Controller
- `GET /api/v1/deliveries` (List deliveries with query filters for status, warehouse)
- `POST /api/v1/deliveries` (Create draft delivery)
- `GET /api/v1/deliveries/:id` (Get delivery details with lines and products)
- `PUT /api/v1/deliveries/:id` (Update delivery header, e.g. contact, scheduled date)
- `DELETE /api/v1/deliveries/:id` (Delete draft delivery)
- `POST /api/v1/deliveries/:id/lines` (Add a line item)
- `PUT /api/v1/deliveries/:id/lines/:lineId` (Update line item requested quantity)
- `DELETE /api/v1/deliveries/:id/lines/:lineId` (Remove line item)
- `POST /api/v1/deliveries/:id/validate` (Transition to `ready` or `waiting` based on stock availability)
- `POST /api/v1/deliveries/:id/complete` (Transition to `done`, deduct stock from `stock_levels`, append to `stock_ledger_entries`)
- `POST /api/v1/deliveries/:id/cancel` (Transition to `canceled`)
- Create `server/src/controllers/delivery.ts` and `server/src/routes/deliveries.ts`.
- Mount `/api/v1/deliveries` in `server/src/app.ts`.

### 3. Frontend API Client
- Create `client/src/api/deliveries.ts` using Axios with typed interfaces for Delivery, DeliveryLine, and requests/responses.

### 4. Frontend UI Components
- **DeliveryList**: A Kanban or List view grouping deliveries by `status`.
- **DeliveryForm**: To create or edit a delivery header.
- **DeliveryDetails**: A view to manage the delivery, displaying its current status, allowing state transitions (Validate, Complete, Cancel), and managing `DeliveryLine` items.
- Ensure the routing matches (e.g. `/deliveries`, `/deliveries/new`, `/deliveries/:id`).
- Add navigation link to the main sidebar/header.

## Consequences

**Positive**:
- Clear, unambiguous state transitions prevent accidental stock deductions.
- Reserving stock at the `ready` stage guarantees that completion will succeed without negative inventory errors.

**Negative / tradeoffs**:
- Validating a delivery requires checking `stock_levels` for every line item, which can be somewhat costly for very large orders. 

## Follow-up

- Consider implementing partial deliveries (if stock is only partially available, create a backorder). For this hackathon scope, a delivery is either fully available or not.

## Rationale

See `rationale.md` for full context on state machine decisions.
