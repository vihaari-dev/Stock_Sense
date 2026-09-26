# 0001. REST API Definitions: StockSense

## Summary

The StockSense backend exposes a RESTful JSON API over HTTP. All endpoints are prefixed with /api/v1. Authentication is via Bearer JWT in the Authorization header. Every route except the /auth group and /health requires a valid access token. Role enforcement is documented per endpoint. Error responses are a consistent JSON shape. This document is the complete API contract; /develop builds from it, no endpoint is invented at build time.

## Base conventions

- Base URL: /api/v1
- Auth header: Authorization: Bearer <access_token>
- Content type: application/json
- Success codes: 200 (ok), 201 (created), 204 (no content)
- Error shape: { "error": { "code": "SNAKE_CASE_CODE", "message": "human string", "details": {} } }
- Pagination: ?page=1&limit=20 on all list endpoints; response includes { data: [], meta: { total, page, limit, totalPages } }
- All timestamps in ISO 8601 UTC (YYYY-MM-DDTHH:mm:ssZ)
- Document references generated server-side on create: <warehouse_code>-<TYPE>-<zero_padded_id_5digits>

## Standard error codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | VALIDATION_ERROR | Missing/invalid input; details contains field errors |
| 401 | UNAUTHORIZED | Missing, expired, or invalid token |
| 403 | FORBIDDEN | Token valid but role not permitted |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Unique constraint violation (duplicate SKU, login_id, etc.) |
| 422 | BUSINESS_RULE_ERROR | Stock engine rule violated (e.g. insufficient stock, invalid state transition) |
| 500 | INTERNAL_ERROR | Unexpected server error |

---

## Auth endpoints (/api/v1/auth)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /auth/signup | POST | none | any | Create account |
| /auth/login | POST | none | any | Login, get tokens |
| /auth/refresh | POST | none | any | Rotate refresh token |
| /auth/logout | POST | bearer | any | Revoke refresh token |
| /auth/forgot-password | POST | none | any | Request OTP |
| /auth/reset-password | POST | none | any | Consume OTP, set new password |
| /auth/me | GET | bearer | any | Get current user profile |

### POST /auth/signup
**Input**:
```json
{
  "loginId": "string (6-12 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 9 chars)",
  "fullName": "string",
  "role": "inventory_manager | warehouse_staff"
}
```
**Output 201**:
```json
{ "id": 1, "loginId": "jsmith", "email": "j@x.com", "role": "inventory_manager", "fullName": "Jane Smith" }
```
**Errors**: 400 (validation), 409 (loginId or email taken)

### POST /auth/login
**Input**: { "loginId": "string", "password": "string" }
**Output 200**: { "accessToken": "...", "refreshToken": "...", "expiresIn": 900, "user": { id, loginId, role, fullName } }
**Errors**: 400, 401

### POST /auth/refresh
**Input**: { "refreshToken": "string" }
**Output 200**: { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }
**Errors**: 401 (invalid/expired/revoked token)

### POST /auth/logout
**Input**: { "refreshToken": "string" }
**Output**: 204
**Errors**: 401

### POST /auth/forgot-password
**Input**: { "email": "string" }
**Output**: 200 (always, even if email not found; prevents email enumeration)
**Errors**: 400

### POST /auth/reset-password
**Input**: { "email": "string", "otp": "string (6 digits)", "newPassword": "string (min 9 chars)" }
**Output**: 200 { "message": "Password reset successful" }
**Errors**: 400 (invalid/expired/used OTP), 404

### GET /auth/me
**Output 200**: { id, loginId, email, role, fullName, isActive, createdAt }
**Errors**: 401

---

## User Profile (/api/v1/users)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /users/me | GET | bearer | any | Same as /auth/me |
| /users/me | PATCH | bearer | any | Update own full name |

### PATCH /users/me
**Input**: { "fullName": "string" }
**Output 200**: updated user object
**Errors**: 400, 401

---

## Categories (/api/v1/categories)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /categories | GET | bearer | any | List all categories |
| /categories | POST | bearer | inventory_manager | Create category |
| /categories/:id | GET | bearer | any | Get single category |
| /categories/:id | PATCH | bearer | inventory_manager | Update category |
| /categories/:id | DELETE | bearer | inventory_manager | Delete (only if no products assigned) |

### GET /categories
**Query**: ?parentId=<id>&search=<string>
**Output 200**: { data: [ { id, name, parentId, createdAt } ], meta: { total } }

### POST /categories
**Input**: { "name": "string", "parentId": number|null }
**Output 201**: { id, name, parentId, createdAt }
**Errors**: 400, 409 (name taken)

### DELETE /categories/:id
**Errors**: 404, 422 (has assigned products)

---

## Units of Measure (/api/v1/uom)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /uom | GET | bearer | any | List all UOMs |
| /uom | POST | bearer | inventory_manager | Create UOM |
| /uom/:id | GET | bearer | any | Get UOM |
| /uom/:id | PATCH | bearer | inventory_manager | Update UOM |
| /uom/:id | DELETE | bearer | inventory_manager | Delete (if no products use it) |

### POST /uom
**Input**: { "name": "string", "abbreviation": "string" }
**Output 201**: { id, name, abbreviation }
**Errors**: 400, 409

---

## Products (/api/v1/products)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /products | GET | bearer | any | List products (paginated) |
| /products | POST | bearer | inventory_manager | Create product |
| /products/:id | GET | bearer | any | Get product detail |
| /products/:id | PATCH | bearer | inventory_manager | Update product |
| /products/:id | DELETE | bearer | inventory_manager | Soft-delete (set is_active=false) |
| /products/:id/stock | GET | bearer | any | Get stock levels per location for product |

### GET /products
**Query**: ?search=<sku|name>&categoryId=<id>&isActive=true&page=1&limit=20
**Output 200**:
```json
{
  "data": [
    {
      "id": 1, "sku": "PROD-001", "name": "Widget A",
      "category": { "id": 2, "name": "Widgets" },
      "uom": { "id": 1, "abbreviation": "pcs" },
      "unitCost": "12.5000", "reorderPoint": 10, "isActive": true
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

### POST /products
**Input**:
```json
{
  "sku": "string", "name": "string", "description": "string|null",
  "categoryId": 1, "uomId": 1,
  "unitCost": "12.50", "reorderPoint": 10, "reorderQty": 50
}
```
**Output 201**: full product object
**Errors**: 400, 409 (SKU taken)

### GET /products/:id/stock
**Output 200**:
```json
{
  "productId": 1,
  "locations": [
    {
      "locationId": 3, "locationName": "Rack A1", "warehouseId": 1, "warehouseName": "Main WH",
      "onHand": 45, "reserved": 10, "freeToUse": 35, "unitCost": "12.5000"
    }
  ],
  "totalOnHand": 45, "totalFreeToUse": 35
}
```


---

## Warehouses (/api/v1/warehouses)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /warehouses | GET | bearer | any | List warehouses |
| /warehouses | POST | bearer | inventory_manager | Create warehouse |
| /warehouses/:id | GET | bearer | any | Get warehouse detail |
| /warehouses/:id | PATCH | bearer | inventory_manager | Update warehouse |
| /warehouses/:id/locations | GET | bearer | any | List locations in warehouse |

### GET /warehouses
**Output 200**: { data: [ { id, name, code, address, isActive } ], meta }

### POST /warehouses
**Input**: { "name": "string", "code": "string (max 10 chars, uppercase)", "address": "string|null" }
**Output 201**: { id, name, code, address, isActive }
**Errors**: 400, 409 (code taken)

### GET /warehouses/:id/locations
**Output 200**: { data: [ { id, name, code, isActive } ] }

---

## Locations (/api/v1/locations)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /locations | POST | bearer | inventory_manager | Create location in a warehouse |
| /locations/:id | GET | bearer | any | Get location detail with stock summary |
| /locations/:id | PATCH | bearer | inventory_manager | Update location |

### POST /locations
**Input**: { "warehouseId": 1, "name": "string", "code": "string (max 20 chars)" }
**Output 201**: { id, warehouseId, name, code, isActive }
**Errors**: 400, 409 (code taken within warehouse)

### GET /locations/:id
**Output 200**: { id, warehouseId, warehouseName, name, code, isActive, stockSummary: [ { productId, sku, onHand, reserved, freeToUse } ] }

---

## Contacts (/api/v1/contacts)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /contacts | GET | bearer | any | List contacts |
| /contacts | POST | bearer | inventory_manager | Create contact |
| /contacts/:id | GET | bearer | any | Get contact |
| /contacts/:id | PATCH | bearer | inventory_manager | Update contact |

### GET /contacts
**Query**: ?type=supplier|customer|other&search=<name>
**Output 200**: { data: [ { id, name, email, phone, type } ], meta }

### POST /contacts
**Input**: { "name": "string", "email": "string|null", "phone": "string|null", "address": "string|null", "type": "supplier|customer|other" }
**Output 201**: { id, name, email, phone, address, type }
**Errors**: 400

---

## Stock (/api/v1/stock)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /stock | GET | bearer | any | List all stock levels (paginated) |
| /stock/low | GET | bearer | any | Products below reorder_point |
| /stock/out | GET | bearer | any | Products with zero on_hand anywhere |

### GET /stock
**Query**: ?warehouseId=<id>&locationId=<id>&categoryId=<id>&search=<sku>&page=1&limit=20
**Output 200**:
```json
{
  "data": [
    {
      "productId": 1, "sku": "PROD-001", "productName": "Widget A",
      "locationId": 3, "locationName": "Rack A1",
      "warehouseId": 1, "warehouseName": "Main WH",
      "onHand": 45, "reserved": 10, "freeToUse": 35,
      "unitCost": "12.5000", "reorderPoint": 10,
      "isLowStock": false
    }
  ],
  "meta": { "total": 120, "page": 1, "limit": 20, "totalPages": 6 }
}
```

### GET /stock/low
**Output 200**: same shape as /stock, filtered to rows where on_hand <= products.reorder_point AND reorder_point > 0

### GET /stock/out
**Output 200**: products where total on_hand across all locations = 0

---

## Receipts (/api/v1/receipts)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /receipts | GET | bearer | any | List receipts (paginated, filterable) |
| /receipts | POST | bearer | inventory_manager | Create receipt |
| /receipts/:id | GET | bearer | any | Get receipt detail with lines |
| /receipts/:id | PATCH | bearer | inventory_manager | Update receipt (draft only) |
| /receipts/:id/validate | POST | bearer | inventory_manager | Transition draft to ready |
| /receipts/:id/complete | POST | bearer | inventory_manager | Transition ready to done; applies stock |
| /receipts/:id/cancel | POST | bearer | inventory_manager | Cancel (draft or ready only) |
| /receipts/:id/lines | POST | bearer | inventory_manager | Add line to receipt |
| /receipts/:id/lines/:lineId | PATCH | bearer | inventory_manager | Update line qty |
| /receipts/:id/lines/:lineId | DELETE | bearer | inventory_manager | Remove line (draft only) |

### GET /receipts
**Query**: ?status=draft|ready|done|canceled&warehouseId=<id>&search=<reference|contactName>&scheduledFrom=<date>&scheduledTo=<date>&page=1&limit=20
**Output 200**:
```json
{
  "data": [
    {
      "id": 1, "reference": "WH01-RCP-00001",
      "status": "draft", "warehouseId": 1, "warehouseName": "Main WH",
      "contact": { "id": 2, "name": "Acme Supplier" },
      "responsibleUser": { "id": 1, "fullName": "Jane Smith" },
      "scheduledDate": "2026-10-01", "lineCount": 3, "createdAt": "..."
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### POST /receipts
**Input**:
```json
{
  "warehouseId": 1,
  "destinationLocationId": 3,
  "contactId": 2,
  "scheduledDate": "2026-10-01",
  "notes": "string|null"
}
```
**Output 201**: receipt header object; reference auto-generated; responsibleUserId = req.user.id
**Errors**: 400

### GET /receipts/:id
**Output 200**: full receipt with lines array: [ { id, product: { id, sku, name }, qtyExpected, qtyReceived, unitCost } ]

### POST /receipts/:id/validate
- Validates: status must be draft; at least one line; each line qtyExpected > 0
- Transitions: draft → ready
**Output 200**: { id, reference, status: "ready" }
**Errors**: 404, 422 (wrong status, no lines)

### POST /receipts/:id/complete
- Validates: status must be ready
- In one transaction:
  1. For each line: update stock_levels (on_hand += qtyReceived); INSERT into stock_ledger_entries (operation_type=receipt, qty_delta=+qtyReceived)
  2. Set receipts.status = done, completed_at = NOW()
- Note: if a stock_levels row does not exist for (product_id, location_id), INSERT with on_hand = qtyReceived.
**Output 200**: { id, reference, status: "done", completedAt }
**Errors**: 404, 422 (wrong status)

### POST /receipts/:id/cancel
**Validates**: status must be draft or ready (not done)
**Output 200**: { id, reference, status: "canceled" }
**Errors**: 404, 422

### POST /receipts/:id/lines
**Input**: { "productId": 1, "qtyExpected": 50, "unitCost": "12.50" }
**Validates**: receipt must be in draft; product must exist and be active
**Output 201**: line object
**Errors**: 400, 404, 409 (product already on receipt), 422 (not draft)


---

## Deliveries (/api/v1/deliveries)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /deliveries | GET | bearer | any | List deliveries |
| /deliveries | POST | bearer | inventory_manager | Create delivery |
| /deliveries/:id | GET | bearer | any | Get delivery detail |
| /deliveries/:id | PATCH | bearer | inventory_manager | Update delivery (draft only) |
| /deliveries/:id/validate | POST | bearer | any | Check stock; transition to waiting or ready |
| /deliveries/:id/complete | POST | bearer | any | Transition ready to done; decreases stock |
| /deliveries/:id/cancel | POST | bearer | inventory_manager | Cancel (draft, waiting, ready only) |
| /deliveries/:id/lines | POST | bearer | inventory_manager | Add line |
| /deliveries/:id/lines/:lineId | PATCH | bearer | inventory_manager | Update line qty |
| /deliveries/:id/lines/:lineId | DELETE | bearer | inventory_manager | Remove line (draft only) |

### GET /deliveries
**Query**: ?status=draft|waiting|ready|done|canceled&warehouseId=<id>&search=<reference|contactName>&scheduledFrom=<date>&scheduledTo=<date>&page=1&limit=20
**Output 200**: paginated list; each item includes: id, reference, status, warehouseId, warehouseName, contact, responsibleUser, scheduledDate, lineCount, hasUnavailableLines (bool)

### POST /deliveries
**Input**:
```json
{
  "warehouseId": 1, "sourceLocationId": 3, "contactId": 2,
  "deliveryAddress": "string|null", "scheduledDate": "2026-10-05", "notes": "string|null"
}
```
**Output 201**: delivery header; reference auto-generated; responsibleUserId = req.user.id

### POST /deliveries/:id/validate
- Checks stock for each line against the specified location (or warehouse total if no location)
- Sets delivery_lines.is_available = 1|0 per line
- If ANY line is unavailable: transition to waiting; sets hasUnavailableLines = true
- If ALL lines available: transition to ready
**Output 200**: { id, reference, status: "waiting"|"ready", lines: [ { productId, qtyRequested, isAvailable } ] }
**Errors**: 404, 422 (not in draft/waiting)

### POST /deliveries/:id/complete
- Validates: status must be ready; all lines must have is_available = 1
- In one transaction:
  1. For each line: check current on_hand >= qtyRequested (re-check at write time to prevent race)
  2. Update stock_levels (on_hand -= qtyRequested)
  3. INSERT stock_ledger_entries (operation_type=delivery, qty_delta=-qtyRequested)
  4. Update delivery_lines.qty_delivered = qtyRequested
  5. Set deliveries.status = done, completed_at = NOW()
**Output 200**: { id, reference, status: "done", completedAt }
**Errors**: 404, 422 (wrong status, insufficient stock)

---

## Transfers (/api/v1/transfers)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /transfers | GET | bearer | any | List transfers |
| /transfers | POST | bearer | warehouse_staff | Create transfer |
| /transfers/:id | GET | bearer | any | Get transfer detail |
| /transfers/:id | PATCH | bearer | warehouse_staff | Update (draft only) |
| /transfers/:id/validate | POST | bearer | warehouse_staff | Validate; transition to ready |
| /transfers/:id/complete | POST | bearer | warehouse_staff | Complete; move stock between locations |
| /transfers/:id/cancel | POST | bearer | warehouse_staff | Cancel |
| /transfers/:id/lines | POST | bearer | warehouse_staff | Add line |
| /transfers/:id/lines/:lineId | PATCH | bearer | warehouse_staff | Update line |
| /transfers/:id/lines/:lineId | DELETE | bearer | warehouse_staff | Remove line (draft only) |

### POST /transfers
**Input**:
```json
{
  "sourceLocationId": 3, "destinationLocationId": 5,
  "scheduledDate": "2026-10-05", "notes": "string|null"
}
```
**Validates**: source != destination (also enforced at DB)
**Output 201**: transfer header; reference auto-generated

### POST /transfers/:id/complete
- Validates: status must be ready; for each line check source on_hand >= qty
- In one transaction:
  1. For each line:
     a. Decrease source location: UPDATE stock_levels SET on_hand = on_hand - qty WHERE product_id=X AND location_id=sourceId
     b. Increase destination location: INSERT INTO stock_levels ... ON DUPLICATE KEY UPDATE on_hand = on_hand + qty
     c. INSERT stock_ledger_entries twice: operation_type=transfer_out (qty_delta=-qty) and transfer_in (qty_delta=+qty)
  2. Set transfers.status = done, completed_at = NOW()
**Output 200**: { id, reference, status: "done", completedAt }
**Errors**: 404, 422 (insufficient stock at source, wrong status)

---

## Adjustments (/api/v1/adjustments)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /adjustments | GET | bearer | any | List adjustments |
| /adjustments | POST | bearer | warehouse_staff | Create adjustment |
| /adjustments/:id | GET | bearer | any | Get adjustment detail |
| /adjustments/:id/complete | POST | bearer | warehouse_staff | Complete; apply delta to stock |
| /adjustments/:id/cancel | POST | bearer | warehouse_staff | Cancel (draft only) |
| /adjustments/:id/lines | POST | bearer | warehouse_staff | Add line (auto-fills qty_recorded from stock_levels) |
| /adjustments/:id/lines/:lineId | PATCH | bearer | warehouse_staff | Update qty_counted |
| /adjustments/:id/lines/:lineId | DELETE | bearer | warehouse_staff | Remove line (draft only) |

### POST /adjustments
**Input**: { "locationId": 3, "notes": "string|null" }
**Output 201**: adjustment header; reference auto-generated

### POST /adjustments/:id/lines
**Input**: { "productId": 1, "qtyCounted": 97 }
- Server looks up current stock_levels.on_hand for (productId, locationId); stores as qty_recorded
- Computes delta = qtyCounted - qty_recorded; stores delta
**Output 201**: { id, productId, qtyRecorded: 100, qtyCounted: 97, delta: -3 }
**Errors**: 400, 404, 409 (product already on adjustment), 422 (not draft)

### POST /adjustments/:id/complete
- Validates: status must be draft; at least one line
- In one transaction:
  1. For each line:
     a. If delta != 0: UPDATE stock_levels SET on_hand = on_hand + delta WHERE product_id=X AND location_id=Y
     b. If delta < 0 and resulting on_hand < 0: error 422 (cannot bring stock below zero)
     c. INSERT stock_ledger_entries (operation_type=adjustment, qty_delta=delta)
  2. Set adjustments.status = done, completed_at = NOW()
**Output 200**: { id, reference, status: "done", completedAt, lines: [ { productId, qtyRecorded, qtyCounted, delta } ] }
**Errors**: 404, 422 (wrong status, would go negative)

---

## Move History (/api/v1/move-history)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /move-history | GET | bearer | any | List ledger entries (paginated, filterable) |
| /move-history/:id | GET | bearer | any | Get single ledger entry |

### GET /move-history
**Query**: ?productId=<id>&locationId=<id>&warehouseId=<id>&operationType=receipt|delivery|transfer_out|transfer_in|adjustment&documentType=receipt|delivery|transfer|adjustment&search=<documentReference>&from=<date>&to=<date>&page=1&limit=20

**Output 200**:
```json
{
  "data": [
    {
      "id": 1,
      "product": { "id": 1, "sku": "PROD-001", "name": "Widget A" },
      "location": { "id": 3, "name": "Rack A1", "warehouseId": 1, "warehouseName": "Main WH" },
      "operationType": "receipt",
      "documentType": "receipt",
      "documentId": 5,
      "documentReference": "WH01-RCP-00005",
      "qtyDelta": 100,
      "qtyAfter": 145,
      "unitCostSnapshot": "12.5000",
      "performedBy": { "id": 1, "fullName": "Jane Smith" },
      "occurredAt": "2026-09-25T10:00:00Z",
      "direction": "in"
    }
  ],
  "meta": { "total": 340, "page": 1, "limit": 20, "totalPages": 17 }
}
```

Note: direction = in when qtyDelta > 0, out when qtyDelta < 0.

---

## Reports (/api/v1/reports)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /reports/stock-status | GET | bearer | any | Full stock snapshot across all locations |
| /reports/low-stock | GET | bearer | any | Products at or below reorder_point |
| /reports/movement-history | GET | bearer | any | Alias to /move-history with report-oriented defaults |

### GET /reports/stock-status
**Query**: ?warehouseId=<id>&categoryId=<id>
**Output 200**: flattened table: { data: [ { sku, name, category, uom, warehouseCode, locationCode, onHand, reserved, freeToUse, unitCost, totalValue (onHand * unitCost) } ] }

### GET /reports/low-stock
**Query**: ?warehouseId=<id>&categoryId=<id>
**Output 200**: same shape, filtered to on_hand <= reorder_point AND reorder_point > 0

---

## Dashboard (/api/v1/dashboard)

| Endpoint | Method | Auth | Role | Description |
|---|---|---|---|---|
| /dashboard/kpis | GET | bearer | any | Key inventory and operational KPIs |

### GET /dashboard/kpis
**Output 200**:
```json
{
  "totalActiveProducts": 142,
  "lowStockCount": 8,
  "outOfStockCount": 3,
  "pendingReceipts": 5,
  "pendingDeliveries": 12,
  "waitingDeliveries": 4,
  "scheduledTransfers": 2,
  "lateOperations": 3,
  "todaysOperations": 7
}
```
Implementation notes:
- pendingReceipts = COUNT(receipts WHERE status IN ('draft','ready'))
- pendingDeliveries = COUNT(deliveries WHERE status IN ('draft','waiting','ready'))
- waitingDeliveries = COUNT(deliveries WHERE status = 'waiting')
- lateOperations = COUNT(all documents WHERE status NOT IN ('done','canceled') AND scheduled_date < TODAY())
- todaysOperations = COUNT(all documents WHERE scheduled_date = TODAY())
- totalActiveProducts = COUNT(products WHERE is_active = 1)
- lowStockCount = COUNT(DISTINCT product_id FROM stock_levels JOIN products WHERE on_hand <= reorder_point AND reorder_point > 0)
- outOfStockCount = products where SUM(on_hand) = 0 across all locations

---

## Health Check

### GET /health
**Auth**: none
**Output 200**: { "status": "ok", "db": "connected", "timestamp": "..." }

---

## Value Sourcing Summary

| Action | Value produced | Source |
|---|---|---|
| POST /receipts | reference | Generated: warehouse.code + '-RCP-' + LPAD(receipt.id, 5, '0') |
| POST /deliveries | reference | Generated: warehouse.code + '-DEL-' + LPAD(delivery.id, 5, '0') |
| POST /transfers | reference | Generated: source_location.warehouse.code + '-TRF-' + LPAD(transfer.id, 5, '0') |
| POST /adjustments | reference | Generated: location.warehouse.code + '-ADJ-' + LPAD(adjustment.id, 5, '0') |
| POST /receipts/:id/complete | stock_levels.on_hand | Previous on_hand + receipt_line.qty_received |
| POST /deliveries/:id/complete | stock_levels.on_hand | Previous on_hand - delivery_line.qty_requested |
| POST /transfers/:id/complete | source on_hand | Previous - transfer_line.qty |
| POST /transfers/:id/complete | dest on_hand | Previous + transfer_line.qty |
| POST /adjustments/:id/complete | stock_levels.on_hand | Previous on_hand + adjustment_line.delta |
| All ledger entries | qty_after | Actual on_hand value immediately after UPDATE in same transaction |
| All ledger entries | unit_cost_snapshot | products.unit_cost at time of operation |
| POST /adjustments/:id/lines | qty_recorded | stock_levels.on_hand at time of line creation |
| Any protected route | req.user | JWT payload decoded by requireAuth middleware |
| Responsible user on documents | responsibleUserId | req.user.id from JWT; always the logged-in user |
| delivery_lines.is_available | 0 or 1 | stock_levels.on_hand >= delivery_line.qty_requested at validate time |

---

## Key Invariants (API layer)

1. No operational document transitions to done more than once (state machine guard before any stock write)
2. Stock is never written below zero (pre-checked and enforced with 422 on attempt)
3. Every completed operation inserts to stock_ledger_entries in the same transaction as the stock_levels update; no partial writes
4. Document responsible user is always the logged-in user (from JWT) on create; no client-supplied override
5. References are server-generated; never client-supplied

