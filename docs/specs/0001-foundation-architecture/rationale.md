# 0001. Foundation Architecture: Rationale

## Context

StockSense is a new inventory management system (no existing code). The product has two user roles, multi-warehouse stock tracking, a stock ledger, operational documents (receipts, deliveries, transfers, adjustments), and reporting. The team is building for a hackathon (local deployment now, production later). The engineer explicitly named the stack: React, Node.js, Express, MySQL, Sequelize. The architecture decision is therefore about confirming, structuring, and locking down the stack rather than evaluating from scratch.

The central product requirement is inventory correctness: every stock-changing event must be traceable, movements must be auditable, and the ledger must be accurate. This demands ACID transactions, relational integrity (foreign keys, constraints), and a schema that separates product master data, stock state, operational documents, and the movement ledger into distinct, properly normalized tables. MySQL with Sequelize is well suited; the risk is in schema design, not stack selection.

The scope uses a Tracer Bullet build approach: build thin vertical slices end to end, not a frontend shell first. This means the DB schema and API contract must be finalized before any feature building starts, which is why this spec exists.

## Options considered

### Option 1: Node.js + Express + MySQL + Sequelize + React (chosen)

The stack the engineer named. Proven OLTP stack for CRUD-heavy inventory workflows. MySQL is a mature RDBMS with strong JSON support, ACID guarantees, and familiar tooling for most teams.

**Pros**:
- TypeScript end-to-end, one language
- Sequelize handles migrations and model definitions; raw SQL for complex ledger queries
- Large community, well-documented failure modes
- No vendor lock-in for auth or storage

**Cons**:
- Sequelize migration ordering discipline required; no guardrails against skipping migrations
- MySQL lacks some PostgreSQL niceties (e.g., full RETURNING support, advanced CHECK constraints pre-8.0)

### Option 2: Next.js full-stack + PostgreSQL + Prisma

A unified full-stack framework with server components. Prisma has better type safety than Sequelize.

**Pros**:
- Single deployable, SSR out of the box
- Prisma's schema-first approach generates types automatically

**Cons**:
- Engineer did not choose this; switching adds friction and learning cost
- Next.js App Router adds complexity that is not needed for a hackathon team
- PostgreSQL instead of MySQL requires re-learning differences (e.g., ENUM handling, AUTO_INCREMENT vs SERIAL)

### Option 3: Supabase BaaS + React

Managed backend: PostgreSQL, auth, real-time, row-level security out of the box.

**Pros**:
- Extremely fast to set up auth and real-time stock alerts
- Built-in row-level security policies for role isolation

**Cons**:
- Engineer did not choose this
- BaaS vendor lock-in; migrating off Supabase later is painful
- Less control over the schema and migration lifecycle

## Rationale

The engineer's stack choice (React, Node.js, Express, MySQL, Sequelize) is sound for this product. The key force from context is inventory correctness: ACID transactions are non-negotiable for stock ledger writes, and MySQL 8.x delivers them reliably. Sequelize handles the migration lifecycle and model definitions, with the understood convention that complex aggregation queries (stock level per location, movement history summaries) use raw SQL where the ORM abstraction breaks down.

The alternative stacks (Next.js/Prisma, Supabase) were not chosen by the engineer and introduce new learning curves with no proportional benefit at hackathon scale. Supabase in particular would reduce schema control, which is exactly the wrong tradeoff for a product whose central value is stock correctness and auditability.

The one decision this rationale makes beyond confirming the chosen stack is the auth mechanism: JWT access tokens (short-lived, 15 min) with refresh token rotation stored in the DB. This gives the product session revocation capability (a refresh token can be invalidated on logout), which a pure stateless JWT approach lacks. The DB overhead (one read per refresh) is negligible at hackathon scale.

## References

No references section (level: none).
