# StockSense — Project Context

## Product
Inventory management system. Two roles: inventory_manager, warehouse_staff.
Scope: docs/scope/scope.md
Foundation spec: docs/specs/0001-foundation-architecture/index.md

## Stack
| Layer | Choice |
|---|---|
| Language | TypeScript (Node.js 20 LTS) |
| Backend | Express.js in server/ |
| ORM | Sequelize (raw SQL for complex ledger/report queries) |
| Database | MySQL 8.x |
| Frontend | React (Vite) in client/ |
| Auth | JWT access tokens (15 min, HS256) + refresh token rotation (HttpOnly cookie) |
| Email | Nodemailer + SMTP (OTP delivery) |
| Logging | morgan (HTTP) + winston (structured) |
| Validation | express-validator |

## Directory layout
```
Stock_Sense/
  server/             Express + TypeScript backend
    src/
      config/         Config loader, Sequelize instance
      middleware/     errorHandler, notFound, requireAuth (auth feature)
      models/         Sequelize models (one file per table)
      routes/         Express routers (one file per domain)
      controllers/    Route handlers
      services/       Business logic (stock engine, auth, etc.)
      utils/          logger, crypto helpers
      types/          Shared TypeScript types
    migrations/       Sequelize CLI migrations (20260001...20260019)
    seeders/          Reference data seeds
  client/             React + Vite frontend
    src/
      api/            Axios client + typed API callers
      components/     Reusable UI components
      pages/          Route-level page components
      hooks/          Custom React hooks
      context/        Auth context
      types/          Shared frontend types
  docs/
    scope/            scope.md — feature inventory
    specs/            Architecture and feature specs
```

## Conventions
- API base: /api/v1
- Error shape: { error: { code, message, details? } }
- Pagination: ?page=1&limit=20, response meta: { total, page, limit, totalPages }
- All timestamps: ISO 8601 UTC
- Document references: <WAREHOUSE_CODE>-<TYPE>-<zero_padded_5digit_id>
- Primary keys: BIGINT AUTO_INCREMENT everywhere
- Migrations: run in file name order (20260001 → 20260019)
- ORM for CRUD; raw SQL (sequelize.query) for ledger aggregates and reports

## Auth
- requireAuth middleware: verifies JWT, attaches req.user = { sub, loginId, role }
- requireRole(...roles) middleware: 403 if req.user.role not in allowed list
- Refresh token: HttpOnly cookie named `refreshToken`, SameSite=Strict
- Access token: returned in JSON body, stored in memory client-side (not localStorage)

## Role permission matrix
See: docs/specs/0001-foundation-architecture/0001-auth-design.md

## Env vars
See: server/.env.example

## Key invariants (enforce in code and DB)
- stock_levels.on_hand >= 0 at all times
- Every stock mutation writes to stock_ledger_entries in the same DB transaction
- Document references are server-generated, never client-supplied
- No done document can transition to done again (state machine guard before any ledger write)

## Workflow
Beta: Build → Verify → Test → Review before marking done

## Git
integration: off
