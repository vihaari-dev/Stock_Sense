# Rationale: Dashboard and Operational Overview

## Context

After login, every user needs an immediate sense of where things stand before they start any operational work. Without a dashboard, users would have to open receipts, deliveries, and transfers separately just to know whether anything needs attention. The dashboard solves this by consolidating the most important inventory and operational indicators into one read only page. The scope document (feature 3) defines the required KPI set and states that both roles should see the same page.

## Options considered

### Option 1: Single aggregation endpoint (chosen)

One endpoint returns all KPI values computed server side. The frontend makes a single request and renders the result.

**Pros**:
- Minimal round trips; the page is useful the moment one response arrives.
- All SQL runs in one service function, easy to read and test.

**Cons**:
- If one count is slow, the whole payload is delayed.

### Option 2: Separate endpoint per KPI

Each card fetches its own endpoint independently.

**Pros**:
- Individual cards can load as their data arrives.

**Cons**:
- Seven parallel requests on page load; more complex frontend coordination; no meaningful benefit at this scale.

## Rationale

The single endpoint is the right call for this product at this stage. All seven counts are cheap aggregation queries on indexed columns. The complexity of managing seven independent loading states outweighs any perceived parallelism benefit. React Query handles caching cleanly for a single fetch, and the whole payload is small.

## References

**Project sources**:
- `docs/scope/scope.md` lines 181 to 199: dashboard requirements and KPI set
- `docs/specs/0001-foundation-architecture/0001-auth-design.md` line 88: `/dashboard/kpis GET` is permitted for both roles
- `docs/specs/0001-foundation-architecture/0001-db-schema.md`: tables that supply the counts (products, stock_levels, receipts, deliveries, transfers)
