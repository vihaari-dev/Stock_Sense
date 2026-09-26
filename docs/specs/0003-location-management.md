# 0003. Location Management

**Date**: 2026-09-26
**Status**: In Progress

## Summary

Location management gives inventory managers one place to maintain warehouse locations and lets both roles see what stock is stored at each one. It uses the existing location table and adds a paginated list across warehouses, a detail view, and clear rules for changes and deactivation. The feature keeps movement records tied to stable location identities.

## Context

StockSense tracks stock by physical location across multiple warehouses. The existing database already stores each location's warehouse, name, code, active state, and timestamps. Stock levels and operational records refer to locations by ID, and the stock ledger is append only.

The foundation API defines location creation, detail, update, and a warehouse scoped list. The app has no location model, management route, or management screen yet. The scope requires location records to support questions about which product is stored where and in what quantity.

Both inventory managers and warehouse staff need location information. The authorization design already permits both roles to read locations and reserves master data changes to inventory managers. The ledger stores location IDs but not historical name or code snapshots, so changing labels after a stock movement would change how past records are displayed.

## Requirements

**User stories**:
- As an inventory manager, I want to create, edit, find, deactivate, and reactivate locations so that warehouse stock can be assigned to the right physical place.
- As warehouse staff, I want to see a location's products and quantities so that I can find stock where it is stored.

**Acceptance criteria**:
- **AC-1**: An authenticated user can open `/locations` from the authenticated navigation. The page shows a table across warehouses with location name, code, warehouse, and availability. Inventory managers see management actions. Warehouse staff have read only access.
- **AC-2**: `GET /api/v1/locations` returns a paginated list. It supports search by location name or code, a `warehouseId` filter, and an `isActive` filter. Active locations are the default. `isActive=false` returns inactive locations and `isActive=all` returns both. Results include the warehouse name and code and use the standard `data` and `meta` response shape.
- **AC-3**: An inventory manager can create a location under an active warehouse with a required name of at most 150 characters and a required code of at most 20 characters. Input is trimmed, code is stored in uppercase, and a code remains unique within its warehouse even after deactivation. Invalid input returns 400, a missing warehouse returns 404, an inactive warehouse returns 422, and a duplicate code returns 409.
- **AC-4**: An inventory manager can update a location's name or code before its first stock movement and can change its active state under the lifecycle rules. The warehouse cannot be changed. Name and code changes after the first stock ledger entry return 422. Warehouse staff cannot change a location.
- **AC-5**: Selecting a location shows each product with stock at that location, its on hand quantity, reserved quantity, and free to use quantity. Free to use is calculated as on hand minus reserved. A location with no stock shows an empty stock state.
- **AC-6**: A location can be deactivated only when all its stock quantities are zero and no open receipt (`draft` or `ready`), delivery (`draft`, `waiting`, or `ready`), transfer (`draft` or `ready`), or adjustment (`draft`) refers to it. A blocked request returns 422 with the stock quantities and open document references, and leaves the location unchanged. Completed and canceled records remain linked to the location. Locations are never hard deleted.
- **AC-7**: A location can be created or reactivated only under an active warehouse. If a warehouse becomes inactive, its locations become unavailable for new use without changing their own `isActive` value. A location cannot be moved to another warehouse.
- **AC-8**: Missing authentication returns 401 and a warehouse staff write returns 403. The page distinguishes loading, no locations, no search results, and API failure. Failed edits keep the entered values and show a clear retry path.

## Options considered

### Option 1: Keep flat locations with an explicit active lifecycle

Use the existing location record and warehouse relationship. Keep historical references, use the active state for deactivation, and block changes that would make a location's history misleading.

**Pros**:
- Uses the schema, foreign keys, and API decisions already recorded for StockSense.
- Preserves stock and document references without rewriting historical records.
- Adds the needed management workflow without another database entity.

**Cons**:
- The model does not express nested areas such as a room containing racks and shelves.
- Name and code corrections are restricted after the first stock movement.

### Option 2: Add a hierarchy of zones, racks, and shelves

Represent each physical level as a parent or child location, or as a separate entity.

**Pros**:
- Represents complex warehouse layouts directly.
- Can support future navigation by physical level.

**Cons**:
- Adds schema and interface complexity before the scope requires nested locations.
- Stock and operational records would still need one precise leaf location, so transfers and selectors become more complex.

### Option 3: Treat locations as disposable records

Allow deletion and recreation when a location is no longer in use.

**Pros**:
- Keeps the active list small without a status filter.
- Makes unused setup records easy to remove.

**Cons**:
- Existing foreign keys restrict deletion after stock or documents refer to a location.
- Reusing a name or code can make historical records harder to interpret.

## Decision

**Chosen option**: Option 1: Keep flat locations with an explicit active lifecycle

Use the existing `locations` table and REST contract. Add the missing global list and management screen. Treat deactivation as a business state, not deletion, and keep location labels stable after stock starts moving through that location.

**Implementation skills**: `frontend-design` (`StockSense/Stock_Sense`, `.agents/skills/frontend-design/`)

## Rationale

The current schema already models one warehouse to many flat locations, and other records refer to locations through restricted foreign keys. A new hierarchy or hard deletion would force changes across stock, documents, and movement history for no stated requirement. The selected table, side panel, and active state fit the existing StockSense interface and the current master data contract.

The ledger keeps a stable location ID but no label snapshot. Locking name and code after the first movement preserves the readable meaning of past history without adding a history table or altering the ledger. Before any movement, managers can still correct setup mistakes. Deactivation remains reversible, while checks prevent hiding stock or unfinished work. Trim and uppercase codes so warehouse staff see one stable form and the existing unique key cannot be bypassed by casing. A case preserving input rule is the runner up, but it would display equivalent codes inconsistently. Server side pagination keeps the global list bounded instead of loading the full catalog into the browser.

## Feature design

**Data model sketch**:

| Entity | Fields | Relationship |
|---|---|---|
| `warehouses` (existing reference) | `id BIGINT` primary key, `name`, `code`, `is_active` | One warehouse has many locations. |
| `locations` (managed here) | `id BIGINT` primary key, required `warehouse_id BIGINT`, required `name VARCHAR(150)`, required `code VARCHAR(20)`, `is_active TINYINT(1)` default true, `created_at`, `updated_at` | Each location belongs to exactly one warehouse. `warehouse_id` references `warehouses.id` with delete restricted. |

`locations` already has a unique constraint on `(warehouse_id, code)` and an index on `warehouse_id`. Keep those constraints. Existing `stock_levels`, receipts, deliveries, transfers, adjustments, and stock ledger rows continue to reference locations by ID. Their foreign keys restrict deletion. Add a minimal `Warehouse` Sequelize model for reading warehouse name, code, and active state, plus a `Location` model and association. No new table or migration is required.

The location's own state is `isActive`. Its availability is derived as `isActive && warehouse.isActive`. A warehouse becoming inactive does not change the location row. Keep locations and their stock readable even when unavailable.

**State transitions**:

| Current state | Action | Result | Guard |
|---|---|---|---|
| Active | Deactivate | Inactive | Every stock level is zero and no open document refers to the location. |
| Inactive | Reactivate | Active | Parent warehouse is active. |
| Active or inactive | Parent warehouse becomes inactive | Same location state, unavailable | Availability is derived from both active states. |

Name and code can change before a stock ledger entry exists. After the first ledger entry, both are immutable. Warehouse assignment is immutable from creation.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/locations` | GET | `page`, `limit`, `search`, `warehouseId`, `isActive` | Paginated rows with `id`, `name`, `code`, `warehouseId`, `warehouseName`, `warehouseCode`, `isActive`, `warehouseIsActive`, and `isAvailable` | Bearer, both roles | 400 invalid query, 401, 500 |
| `/api/v1/locations` | POST | `warehouseId`, `name`, `code` | `id`, `warehouseId`, `name`, `code`, `isActive`, `isAvailable` | Bearer, inventory manager | 400 validation, 401, 403, 404 warehouse missing, 409 duplicate code, 422 inactive warehouse |
| `/api/v1/locations/:id` | GET | Location ID | Location fields, `warehouseIsActive`, `isAvailable`, and `stockSummary` rows with `productId`, `sku`, `productName`, `onHand`, `reserved`, and `freeToUse` | Bearer, both roles | 401, 404, 500 |
| `/api/v1/locations/:id` | PATCH | Optional `name`, `code`, or `isActive`; `warehouseId` is not accepted | Updated location fields and derived availability | Bearer, inventory manager | 400 validation, 401, 403, 404, 409 duplicate code, 422 label locked, location in use, or inactive warehouse |
| `/api/v1/warehouses/:id/locations` | GET | Warehouse ID | Existing warehouse scoped location list | Bearer, both roles | Existing contract, unchanged |

For the global list, `page` defaults to 1 and `limit` to 20, with a maximum limit of 100. `search` matches name or code without case distinction. `isActive` defaults to `true` and accepts `false` or `all`. Order results by warehouse name, code, then location ID for stable pagination. The create form uses the existing warehouse list and offers active warehouses only. The detail response includes stock rows where `onHand` is greater than zero.

The `PATCH` request rejects `warehouseId`. Setting `isActive` to false checks stock and open documents in a database transaction. Open documents are receipts in `draft` or `ready`, deliveries in `draft`, `waiting`, or `ready`, transfers in `draft` or `ready`, and adjustments in `draft`. A blocked request returns `422 BUSINESS_RULE_ERROR` with code `LOCATION_IN_USE` and `details` containing stock quantities and document type, reference, and status. A label change after a ledger entry returns `422 BUSINESS_RULE_ERROR` with code `LOCATION_LABEL_LOCKED`.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Global list | Location ID, name, code, own active state, creation and update times | `locations.id`, `name`, `code`, `is_active`, `created_at`, `updated_at` |
| Global list | Warehouse ID, name, code, and active state | `locations.warehouse_id` joined to `warehouses.id`, `name`, `code`, `is_active` |
| Global list | Availability | Derived from `locations.is_active && warehouses.is_active` |
| Global list | Search, warehouse, and status filtering | `search`, `warehouseId`, and `isActive` query inputs; name and code columns supply search matches |
| Global list | Pagination totals and page count | The filtered database query and `page` and `limit` query inputs |
| Location detail | Product ID, SKU, and product name | `stock_levels.product_id` joined to `products.id`, `sku`, and `name` |
| Location detail | On hand and reserved quantities | `stock_levels.on_hand` and `stock_levels.reserved` for the location |
| Location detail | Free to use quantity | Derived as `stock_levels.on_hand - stock_levels.reserved` |
| Create location | Warehouse, name, and code | `warehouseId`, `name`, and `code` request fields |
| Create location | ID, active state, and timestamps | Database generated `locations.id`, default `is_active`, `created_at`, and `updated_at` |
| Update location | New name, code, or active state | `name`, `code`, or `isActive` request fields; `locations` row for omitted fields |
| Deactivation guard | Current stock blockers | `stock_levels.on_hand` and `stock_levels.reserved` for the location, joined to product identity |
| Deactivation guard | Open document blockers | Location references and the open statuses listed above in receipts, deliveries, transfers, and adjustments; document references from each parent row |
| Authorization | Read or write permission | `req.user.role` from the authenticated JWT and the authorization design |

**Key invariants**:
- A location belongs to exactly one warehouse. Its warehouse cannot change.
- A code is trimmed, stored in uppercase, and unique within its warehouse across active and inactive records.
- Name and code cannot change after the first stock ledger entry.
- No location is hard deleted. Completed and canceled documents and ledger entries keep their location reference.
- A location is available for new use only when both it and its warehouse are active.
- Location deactivation cannot leave nonzero stock or open documents attached to an unavailable location.
- Deactivation and its checks are atomic. A failed check does not change `is_active`.
- Future stock operations must recheck location availability in their write transaction.
- `freeToUse` is computed as `onHand - reserved`; it is not stored separately.

**Security model**:

All endpoints require a valid bearer token. Both `inventory_manager` and `warehouse_staff` can read the list and location details. Only `inventory_manager` can create or patch locations. The client hides write actions from warehouse staff, and the API remains authoritative by returning 403 for staff writes. Location records contain no personal or regulated data. Use the existing request and structured logging; mutation logs identify the actor, location ID, and action without recording secrets.

**Critical test scenarios**:
- Happy path: an inventory manager creates a location, finds it in the cross warehouse list, and views its stock summary; verifies **AC-1**, **AC-2**, **AC-3**, and **AC-5**.
- Failure case: duplicate code, inactive warehouse, locked labels, or a deactivation blocked by stock or an open document returns the specified error and leaves state unchanged; verifies **AC-3**, **AC-4**, **AC-6**, and **AC-7**.
- Auth and permission: warehouse staff can read but receive 403 on create or patch, and unauthenticated requests receive 401; verifies **AC-1** and **AC-8**.

## Build plan

1. Add a minimal read only `Warehouse` model and its association with the `Location` model, then implement the global paginated list API and the protected `/locations` page with authenticated navigation. Render the table, search and filters, loading, empty, and error states end to end. No schema migration is needed. Satisfies **AC-1**, **AC-2**, and **AC-8**.
2. Add the location detail response using existing stock and product rows, then connect row selection to the detail panel with on hand, reserved, and computed free to use values. Satisfies **AC-5**.
3. Implement manager create and edit in the side panel, active warehouse selection, field validation, code normalization, duplicate handling, fixed warehouse assignment, and label locking after the first ledger entry. Satisfies **AC-3** and **AC-4**.
4. Implement activate and deactivate through `PATCH`, with transaction guarded stock and document checks, actionable blocker details, and availability derived from the warehouse state. Satisfies **AC-4**, **AC-6**, and **AC-7**.
5. Add API and UI tests for list filters, stock calculations, role access, lifecycle guards, duplicate code races, empty states, and failed requests. Satisfies **AC-1** through **AC-8**.

## Consequences

**Positive**:
- The feature uses the existing relational model and avoids a new migration.
- Stock and historical records retain stable location references.
- Both roles can find physical stock, while location changes remain limited to inventory managers.

**Negative / tradeoffs**:
- Managers cannot correct a location name or code after stock has moved through it. They must create a replacement location and transfer stock when needed.
- The global list and stock detail require joins across warehouse, product, and stock data. Pagination keeps the list bounded, but the stock detail query may need review if locations later contain very large product counts.
- Warehouse deactivation behavior must be coordinated with stock operations so existing quantities do not become stranded.

**Neutral**:
- The existing database schema is reused. The implementation adds Sequelize models and associations, API and client code, and tests, but no schema migration or new configuration.

## Follow-up

- [ ] Before warehouse deactivation is built, define how it is blocked or safely handled when child locations contain stock or open documents.
- [ ] Receipt, delivery, transfer, and adjustment designs must require available locations for new work and recheck availability in their write transactions.
- [ ] The `frontend-design` guidance used here is not listed in project context. Add its conventions to `client/AGENTS.md` before frontend implementation.
