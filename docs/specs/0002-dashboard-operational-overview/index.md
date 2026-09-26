# 0002. Dashboard and Operational Overview

**Date**: 2026-09-26
**Status**: In Progress

## Summary

The dashboard is the landing page every user reaches after login. It shows a snapshot of inventory health and pending operational work in one place. Both roles see the same page. All values come from existing tables via a single aggregation query; no new schema is needed. The backend exposes one new endpoint and the frontend renders a single read only page.

## Requirements

**User stories**:
- As an inventory manager, I want to see pending receipts and deliveries at a glance so I can prioritize today's work.
- As a warehouse staff member, I want to see scheduled transfers and waiting operations so I know what needs my attention.
- As any user, I want to see total stock health indicators so I can spot problems without digging through every record.

**Acceptance criteria**:
- **AC-1**: `GET /api/v1/dashboard/kpis` returns a JSON payload with all seven KPI values: `totalProducts`, `lowStockItems`, `outOfStockItems`, `pendingReceipts`, `pendingDeliveries`, `scheduledTransfers`, `waitingOperations`. Each is a non-negative integer.
- **AC-2**: `pendingReceipts` counts receipts with status `draft` or `ready`. `pendingDeliveries` counts deliveries with status `draft`, `waiting`, or `ready`. `scheduledTransfers` counts transfers with status `draft` or `ready`. `waitingOperations` counts deliveries with status `waiting`.
- **AC-3**: `totalProducts` counts active products (is_active = 1). `lowStockItems` counts distinct products where on_hand > 0 and on_hand <= reorder_point across all stock_levels. `outOfStockItems` counts distinct products where the sum of on_hand across all locations is 0.
- **AC-4**: The endpoint requires a valid JWT (both roles permitted). A missing or invalid token returns 401.
- **AC-5**: The frontend dashboard page renders all seven KPI cards and an operational stats section. Each card shows its label, current count, and an icon. The page renders in both empty state (all zeros) and populated state without errors.
- **AC-6**: The dashboard page is the route the app shows after login. Unauthenticated users who visit `/dashboard` are redirected to `/login`.
- **AC-7**: Slow or failed API calls do not crash the page. A loading skeleton is shown while data loads; an error state is shown if the call fails.

## Decision

**Chosen option**: Single aggregation endpoint with React Query on the frontend.

One `GET /api/v1/dashboard/kpis` endpoint runs COUNT queries against existing tables and returns all KPI values in one response. The frontend fetches this with React Query (60 second stale time) and renders a grid of KPI cards. No new database tables are created.

## Feature design

**Data model sketch**: No new tables. Reads from: `products`, `stock_levels`, `receipts`, `deliveries`, `transfers`.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /dashboard/kpis | GET | none | KpiPayload (7 integer fields) | bearer, both roles | 401, 500 |

**KPI payload shape**:
```json
{
  "totalProducts": 42,
  "lowStockItems": 5,
  "outOfStockItems": 2,
  "pendingReceipts": 3,
  "pendingDeliveries": 7,
  "scheduledTransfers": 4,
  "waitingOperations": 2
}
```

**Value sourcing**:

| Action | Value produced | Source |
|---|---|---|
| GET /dashboard/kpis | totalProducts | COUNT(*) FROM products WHERE is_active = 1 |
| GET /dashboard/kpis | lowStockItems | COUNT(DISTINCT product_id) FROM stock_levels JOIN products ON reorder_point; on_hand > 0 AND on_hand <= reorder_point |
| GET /dashboard/kpis | outOfStockItems | Products where SUM(on_hand) across all locations = 0 |
| GET /dashboard/kpis | pendingReceipts | COUNT(*) FROM receipts WHERE status IN ('draft','ready') |
| GET /dashboard/kpis | pendingDeliveries | COUNT(*) FROM deliveries WHERE status IN ('draft','waiting','ready') |
| GET /dashboard/kpis | scheduledTransfers | COUNT(*) FROM transfers WHERE status IN ('draft','ready') |
| GET /dashboard/kpis | waitingOperations | COUNT(*) FROM deliveries WHERE status = 'waiting' |

**Key invariants**:
- All counts are non-negative integers; queries return 0 when no rows match, never null.
- Endpoint is read only; never mutates any table.

**Security model**:
- `requireAuth` middleware gates the route. Both `inventory_manager` and `warehouse_staff` are permitted (per auth spec permission matrix, `/dashboard/kpis GET`).

**Critical test scenarios**:
- Happy path: authenticated call returns 200 with all seven integer fields, verifies **AC-1**, **AC-2**, **AC-3**.
- Unauthenticated: no Bearer token; expect 401, verifies **AC-4**.
- Empty DB: all tables empty; all counts are 0; no nulls in response, verifies **AC-1**, **AC-3**.
- Frontend error state: API returns 500; page shows error banner, not a crash, verifies **AC-7**.

## Build plan

1. Create `server/src/services/dashboardService.ts`: seven COUNT raw SQL queries via `sequelize.query`, returns typed `KpiPayload`. Satisfies **AC-1**, **AC-2**, **AC-3**.
2. Create `server/src/controllers/dashboardController.ts`: calls service, returns JSON. Satisfies **AC-1**.
3. Create `server/src/routes/dashboard.ts`: `GET /` behind `requireAuth`, calls controller. Satisfies **AC-4**.
4. Register dashboard router in `server/src/app.ts` at `/api/v1/dashboard`. Satisfies **AC-4**.
5. Create `client/src/api/dashboard.ts`: typed Axios caller for the KPIs endpoint. Satisfies **AC-5**.
6. Create `client/src/pages/DashboardPage.tsx`: React Query fetch, KPI card grid, loading skeleton, error state. Satisfies **AC-5**, **AC-7**.
7. Wire route in `client/src/main.tsx` / `App.tsx` so `/dashboard` renders `DashboardPage`; redirect unauthenticated users to `/login`. Satisfies **AC-6**.

## Consequences

**Positive**:
- One endpoint, one round trip; all KPIs load together with no waterfall.
- Pure read queries; zero risk of mutating inventory state.
- React Query caches for 60 seconds; rapid revisits cost zero extra requests.

**Negative / tradeoffs**:
- No real-time updates; user must refresh or wait for stale time to see new data.
- outOfStockItems query is slightly heavier at large product counts; acceptable at current scale.

**Neutral**:
- Auth guard on the client route uses a simple token presence check until the full auth feature is wired.

## Follow-up

- [ ] Wire real auth context (access token in memory) into the dashboard route guard once Authentication feature is built.
- [ ] Add `lateOperations` count (schedule_date < today, status not done/canceled) once operational workflow features land.

## Rationale

See `rationale.md`.
