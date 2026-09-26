# 0001. Authentication and Authorization Design

## Summary

StockSense uses JWT access tokens (short-lived, 15 minutes) paired with refresh token rotation stored in the database. Password reset uses a 6-digit OTP emailed to the registered address. Two roles are enforced via JWT claims and checked in Express middleware on every protected route: inventory_manager and warehouse_staff. Passwords are bcrypt-hashed with cost factor 12. No third-party auth vendor is used.

## Requirements

**User stories**:
- As a user, I want to sign up with a unique login ID and email so I can access the system.
- As a user, I want to log in and receive a session token so I can access protected inventory features.
- As a user, I want to reset my password via a 6-digit OTP sent to my email so I can recover access.
- As a system, I want to enforce role-based access so that inventory managers and warehouse staff can only perform actions appropriate to their role.

**Acceptance criteria**:
- **AC-1**: Sign-up creates a user with a unique login_id (6-12 chars), unique email, bcrypt-hashed password, and assigned role; returns 400 with validation errors on invalid input.
- **AC-2**: Login with valid credentials returns a JWT access token (15 min expiry) and a refresh token (7 day expiry); returns 401 on wrong credentials.
- **AC-3**: The access token JWT payload includes: user id, login_id, role, and expiry. The role claim is used by middleware to gate routes.
- **AC-4**: Refresh token rotation: POST /auth/refresh invalidates the old refresh token and issues a new access token + new refresh token in one atomic DB transaction.
- **AC-5**: Logout invalidates the current refresh token (sets revoked_at); subsequent refresh attempts return 401.
- **AC-6**: OTP password reset: POST /auth/forgot-password sends a 6-digit OTP to the email; POST /auth/reset-password validates the OTP (expires in 15 min, single use) and updates the password hash.
- **AC-7**: Every route except /auth/login, /auth/signup, /auth/forgot-password, /auth/reset-password, and /health requires a valid unexpired access token. A missing or expired token returns 401.
- **AC-8**: Role-gated routes return 403 when the authenticated user's role is not permitted.

## Decision

**Chosen option**: Self-hosted JWT + refresh token rotation (jsonwebtoken + bcrypt + custom Express middleware)

Implement authentication with the jsonwebtoken library for signing/verifying JWTs and bcryptjs for password hashing. Store refresh tokens in the refresh_tokens table. OTP codes in the otp_codes table. No external auth service.

## Feature design

**Token strategy**:
- Access token: JWT (HS256), payload = { sub: userId, loginId, role, iat, exp }; signed with JWT_SECRET; expiry 15 min.
- Refresh token: opaque random token (32 bytes hex via crypto.randomBytes), stored as SHA-256 hash in DB; expiry 7 days.
- Rotation: on refresh, mark old token revoked_at = NOW(), insert new refresh token row, issue new access token. All in one transaction.

**RBAC middleware**:
```typescript
// requireAuth: verifies JWT, attaches req.user = { id, loginId, role }
// requireRole(...roles): checks req.user.role is in allowed roles list
// Usage: router.post('/receipts', requireAuth, requireRole('inventory_manager'), handler)
```

**Route permission matrix** (fully resolved — all gaps closed 2026-09-26):

| Route | Method(s) | inventory_manager | warehouse_staff | Notes |
|---|---|---|---|---|
| /auth/* | all | public | public | No auth required |
| /products | GET | ✅ | ✅ | Both can read |
| /products | POST, PATCH, DELETE | ✅ | ❌ | Master data write: IM only |
| /categories | GET | ✅ | ✅ | |
| /categories | POST, PATCH, DELETE | ✅ | ❌ | |
| /uom | GET | ✅ | ✅ | |
| /uom | POST, PATCH, DELETE | ✅ | ❌ | |
| /warehouses | GET | ✅ | ✅ | Read: both |
| /warehouses | POST, PATCH | ✅ | ❌ | **Resolved**: IM only |
| /locations | GET | ✅ | ✅ | Read: both |
| /locations | POST, PATCH | ✅ | ❌ | **Resolved**: IM only |
| /contacts | GET | ✅ | ✅ | Read: both |
| /contacts | POST, PATCH | ✅ | ❌ | IM only |
| /stock | GET | ✅ | ✅ | Read: both |
| /receipts | GET | ✅ | ✅ | Read: both |
| /receipts | POST, PATCH | ✅ | ❌ | Create/edit: IM only |
| /receipts/:id/validate | POST | ✅ | ❌ | IM only |
| /receipts/:id/complete | POST | ✅ | ❌ | IM only |
| /receipts/:id/cancel | POST | ✅ | ❌ | **Resolved**: IM only for all cancellations |
| /receipts/:id/lines | POST, PATCH, DELETE | ✅ | ❌ | |
| /deliveries | GET | ✅ | ✅ | |
| /deliveries | POST, PATCH | ✅ | ❌ | Create/edit: IM only |
| /deliveries/:id/validate | POST | ✅ | ✅ | **Resolved**: both can re-validate (waiting→ready) |
| /deliveries/:id/complete | POST | ✅ | ✅ | Both: picking and packing is WS responsibility |
| /deliveries/:id/cancel | POST | ✅ | ❌ | **Resolved**: IM only |
| /deliveries/:id/lines | POST, PATCH, DELETE | ✅ | ❌ | |
| /transfers | GET | ✅ | ✅ | |
| /transfers | POST, PATCH | ❌ | ✅ | WS creates and manages |
| /transfers/:id/validate | POST | ❌ | ✅ | |
| /transfers/:id/complete | POST | ❌ | ✅ | |
| /transfers/:id/cancel | POST | ✅ | ❌ | **Resolved**: IM only for all cancellations |
| /transfers/:id/lines | POST, PATCH, DELETE | ❌ | ✅ | |
| /adjustments | GET | ✅ | ✅ | |
| /adjustments | POST | ✅ | ✅ | Both can create (WS counts, IM may also adjust) |
| /adjustments/:id/complete | POST | ✅ | ✅ | Both can validate a count |
| /adjustments/:id/cancel | POST | ✅ | ❌ | **Resolved**: IM only |
| /adjustments/:id/lines | POST, PATCH, DELETE | ✅ | ✅ | |
| /move-history | GET | ✅ | ✅ | |
| /reports/* | GET | ✅ | ✅ | |
| /dashboard/kpis | GET | ✅ | ✅ | |
| /health | GET | public | public | |

**State transitions**:
- Receipt: draft → ready → done; draft|ready → canceled
- Delivery: draft → waiting → ready → done; draft|waiting|ready → canceled
- Transfer: draft → ready → done; draft|ready → canceled
- Adjustment: draft → done; draft → canceled

**Security model**:
- Passwords: bcrypt, cost factor 12.
- JWT_SECRET: min 64 chars random hex, stored in env; never in code.
- Refresh tokens: stored in a `Set-Cookie` response header as an **HttpOnly, SameSite=Strict, Secure** cookie named `refreshToken`. The access token is returned in the JSON body and stored in memory (not localStorage). The `/auth/refresh` route reads the cookie automatically; no client JS can read the refresh token.
- OTP: 6-digit numeric, hashed with SHA-256 before storage, single-use (used_at set on consume), 15 min TTL.
- Rate limiting: apply express-rate-limit to /auth/login and /auth/forgot-password (max 10 req/min per IP).

**Configuration required**:
- `JWT_SECRET`: 64+ char random string; never commit to git
- `JWT_EXPIRES_IN`: default '15m'
- `REFRESH_TOKEN_EXPIRES_DAYS`: default 7
- `OTP_EXPIRES_MINUTES`: default 15
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Nodemailer SMTP config for OTP email delivery
- `COOKIE_SECURE`: set to `true` in production (HTTPS only); `false` for local HTTP dev

**Critical test scenarios**:
- Happy path: user signs up, logs in, receives tokens, calls protected route, refreshes token successfully; verifies AC-1, AC-2, AC-4.
- Expired access token: call protected route 16 min after login without refresh; expect 401; verifies AC-7.
- Role mismatch: warehouse_staff calls POST /warehouses; expect 403; verifies AC-8.
- OTP expired: attempt reset 16 min after requesting OTP; expect 400; verifies AC-6.
- Reused refresh token: after rotation, attempt to use the old refresh token; expect 401; verifies AC-4, AC-5.

## Build plan

1. Add JWT_SECRET and auth config to .env and config loader, satisfies **AC-7**
2. Implement password hashing utility (bcryptjs, cost 12), satisfies **AC-1**
3. Create POST /auth/signup: validate login_id length, unique login_id + email, hash password, insert user; return 201 + user summary, satisfies **AC-1**
4. Create POST /auth/login: verify credentials, sign JWT, generate + store refresh token, return both tokens, satisfies **AC-2**, **AC-3**
5. Create requireAuth middleware: verify JWT signature + expiry, attach req.user; return 401 if missing/invalid/expired, satisfies **AC-7**
6. Create requireRole(...roles) middleware: check req.user.role; return 403 if not permitted, satisfies **AC-8**
7. Apply requireAuth + requireRole to all non-auth routes, satisfies **AC-7**, **AC-8**
8. Create POST /auth/refresh: validate refresh token hash, check not revoked/expired, rotate (revoke old + issue new) in transaction; return new tokens, satisfies **AC-4**
9. Create POST /auth/logout: revoke current refresh token; return 200, satisfies **AC-5**
10. Create POST /auth/forgot-password: look up user by email, generate OTP, hash + store in otp_codes, send via SMTP, return 200 (generic, no email leak), satisfies **AC-6**
11. Create POST /auth/reset-password: validate OTP hash + expiry + not used, update password hash, mark OTP used_at, satisfies **AC-6**
12. Add express-rate-limit to /auth/login and /auth/forgot-password, satisfies **AC-6**, **AC-7**

## Consequences

**Positive**:
- No vendor dependency; full control over token lifetime and revocation
- Refresh token stored in DB allows instant session invalidation on logout
- Role claim in JWT means no DB call needed for every authorization check

**Negative / tradeoffs**:
- Every token refresh requires one DB write (mark old revoked) + one DB insert (new token); negligible at hackathon scale, watch at production scale
- If JWT_SECRET leaks, all sessions are compromised; key rotation requires re-login for all users
- OTP email delivery depends on SMTP config being correct; a misconfigured SMTP silently fails reset flow

**Neutral**:
- Rate limiting is applied at the Express layer; move to a reverse proxy (nginx, Cloudflare) before production

## Follow-up

- [x] **Resolved**: Refresh token transport → HttpOnly cookie (SameSite=Strict, Secure in prod)
- [x] **Resolved**: Email provider → Nodemailer + SMTP
- [ ] Add refresh token cleanup job (purge rows where revoked_at > 30 days old) before going live
- [x] **Resolved**: All RBAC gaps closed (2026-09-26) — see route permission matrix above

