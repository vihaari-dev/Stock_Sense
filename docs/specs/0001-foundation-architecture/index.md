# 0001. StockSense Foundation Architecture

**Date**: 2026-09-26
**Status**: Proposed

## Summary

StockSense is an inventory management web application built on a Node.js and Express REST backend with a React frontend, using MySQL as the primary relational database and Sequelize as the ORM. JWT with refresh token rotation handles authentication and two-role access control. The product runs locally for now (hackathon phase) and can be promoted to a managed PaaS with minimal changes. Every architectural decision here is conservative: proven tools, clear separation of concerns, no premature complexity.

## Structure

This is an umbrella spec. The child specs below cover each major foundational decision:

| Child spec | What it covers | Decision it supports |
|---|---|---|
| [0001-db-schema.md](./0001-db-schema.md) | Full normalized MySQL schema, indexes, constraints, migration order | Primary database design |
| [0001-api-definitions.md](./0001-api-definitions.md) | Complete REST API surface, all endpoints, inputs, outputs, auth | Backend API contract |
| [0001-auth-design.md](./0001-auth-design.md) | JWT access + refresh token, RBAC, OTP password reset flow | Authentication and authorization |

## Decision

**Chosen option**: Node.js + Express + TypeScript + MySQL + Sequelize + React (SPA)

The backend is an Express REST API in TypeScript. The database is MySQL with Sequelize ORM for CRUD and raw SQL for complex reporting queries (stock ledger aggregates, movement history). The frontend is a React single page application consuming the REST API. Authentication uses JWT access tokens (15 minute expiry) plus refresh token rotation stored in the database. Role-based access control (RBAC) enforces two roles: `inventory_manager` and `warehouse_staff`, checked per route in Express middleware. Primary keys are MySQL `BIGINT AUTO_INCREMENT`.

**Implementation skills**: `database-schema-designer` (community skill, `.agents/skills/database-schema-designer/`)

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript (Node.js 20 LTS) | Type safety across the whole stack, excellent Sequelize typings, catches schema mismatches at compile time |
| Backend framework | Express.js | Minimal, well-understood, large middleware ecosystem; no magic for a hackathon team to debug |
| ORM | Sequelize | Chosen explicitly; handles CRUD and migrations cleanly, raw SQL escape hatch for complex queries |
| Primary DB | MySQL 8.x | Relational, ACID, strong JSON column support, familiar tooling; correct for this inventory domain |
| Auth | JWT (access + refresh) via jsonwebtoken + custom middleware | Self-hosted, no vendor, full control over role claims; OTP via email for password reset |
| Frontend | React (Vite) + React Router + Axios | Well-understood SPA setup; Axios for typed API calls |
| State management | React Context + React Query | Simple global auth state in Context; server state with React Query for cache management |
| Hosting (now) | Local (Docker Compose or plain npm run dev) | Hackathon; promote to Railway/Render with one config change |
| Observability | morgan request logger + winston structured logs | Day one visibility with zero infrastructure overhead |

## Consequences

**Positive**:
- Entire stack in TypeScript reduces category of bugs and keeps the team in one language
- MySQL + Sequelize is the most familiar combination for most teams; the ORM handles migrations, the raw SQL escape hatch handles ledger queries
- JWT is stateless for access tokens; refresh tokens stored in DB allow revocation without a cache layer
- REST is the right API shape for this CRUD and workflow product; no schema overhead, easy to test with Postman or Insomnia

**Negative / tradeoffs**:
- Sequelize migrations must be run in order; production promotion requires a migration script strategy (up and down scripts)
- JWT refresh token rotation requires the refresh token table to be queried on every token refresh; adds one DB read per session renewal
- React SPA requires careful handling of protected routes and token expiry in the client; a full page reload without a token can expose unauthenticated states
- No built-in real-time for stock alerts; a polling strategy or WebSocket must be added explicitly if real-time low-stock notifications are needed

**Neutral**:
- The frontend and backend are separate processes; CORS must be configured in Express for local development
- Sequelize models must be kept in sync with the migration files; schema drift is a known risk if migrations are skipped
- The two-role RBAC model is deliberately simple; adding a third role later requires an enum change in the users table and middleware updates

## Follow-up

- [ ] Add AGENTS.md at root once the project is scaffolded so all skills can read the stack (run /audit after first scaffold)
- [ ] Decide on email provider for OTP delivery before implementing password reset (Nodemailer + SMTP, SendGrid, or Resend)
- [ ] Set up Docker Compose for local MySQL so every developer has the same DB environment
- [ ] Confirm whether print functionality (receipts, delivery orders) is PDF generation server-side or browser window.print() client-side
- [ ] Authorization gap analysis from scope.md (who can do what per role) must be resolved before /develop builds any operational route

## Rationale

Full reasoning, options considered, and tradeoff analysis: see rationale.md.
