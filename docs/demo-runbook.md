# StockSense Demo Runbook

This guide seeds a local MySQL database and walks through the UI that is implemented today. The dataset is intentionally small and supports the dashboard, categories, warehouses, locations, and receipt validation.

## Current Demo Coverage

- Authentication: signup, login, logout, protected routes, and role-aware UI. Password reset creates a development OTP in the server console; SMTP delivery is not implemented.
- Dashboard: total active products, low-stock and out-of-stock counts, pending receipts and deliveries, scheduled transfers, and waiting operations.
- Categories: list, create, edit, delete when unused, and parent/child categories. Managers can write; both roles can read.
- Warehouses: list, create, edit, and active/inactive status. Managers can write; both roles can read.
- Locations: active list, search by name/code, warehouse and status filters, and a detail panel with on-hand, reserved, and free-to-use stock. Open `/locations` directly; it is not currently in the navbar. The page currently has no create/edit controls, although the API supports manager writes.
- Receipts: list, detail, create a draft header, and manager-only validation. The prepared receipt has a line so you can validate it from the UI. The UI does not yet include line editing; line APIs exist on the server.
- Products, deliveries, and transfers: database models and dashboard aggregates exist, but their user-facing pages are placeholders. Delivery/transfer seed rows below only make the dashboard KPI tiles nonzero; they are not interactive workflows.

## Prepare The App

1. Start MySQL 8 and create or select a local demo database. The server defaults to `stocksense_dev` on `localhost:3306`.
2. Create `server/.env` with local database credentials and a development JWT secret. The server reads this file. Example values:

   ```dotenv
   NODE_ENV=development
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=stocksense_dev
   DB_USER=root
   DB_PASS=your-local-mysql-password
   JWT_SECRET=local-only-change-this-to-a-long-random-value
   CLIENT_ORIGIN=http://localhost:5173
   COOKIE_SECURE=false
   ```

3. Install dependencies if needed, then apply schema migrations and base reference data from the repository root:

   ```powershell
   npm install --prefix server
   npm install --prefix client
   npm run migrate
   npm run seed
   ```

4. Start the backend and frontend in two terminals:

   ```powershell
   npm run dev:server
   ```

   ```powershell
   npm run dev:client
   ```

5. Open `http://localhost:5173/signup`. Create an **Inventory Manager** with a valid email and a password of at least 8 characters. Use login ID `demo_mgr` for the walkthrough, or use an existing manager account. The SQL prefers `demo_mgr` and otherwise selects the first inventory manager to own the demo documents. Then sign in at `http://localhost:5173/login`.
6. In MySQL Workbench (connected to the same database), open and run [demo-data.sql](demo-data.sql). Confirm the first result has a non-null `demo_manager_id`. Run the script once against a fresh demo database; it avoids overwriting existing stock on a rerun, but a previously completed demo receipt remains completed.

If you already ran the original seed and only want the additional products and second receipt, run [demo-data-additions.sql](demo-data-additions.sql) instead. It adds the keyboard, mouse, headset, supplier, stock rows, and `DEMO-RCP-002` without recreating the original data.

## Demo Walkthrough

1. **Dashboard** (`/dashboard`): on a fresh database, show 6 active products, 2 low-stock items, 1 out-of-stock item, 2 pending receipts, 1 pending delivery, 1 scheduled transfer, and 1 waiting operation. These counts assume no other operational rows. Use **Refresh** after a stock operation.
2. **Categories** (`/categories`): show `Demo Electronics` and its child `Demo Cables`, including product counts. As the manager, create and edit an unused demo category; delete is disabled when products or child categories reference it.
3. **Warehouses** (`/warehouses`): show both seeded warehouses. Demonstrate **New Warehouse** and edit a warehouse address. Avoid deactivating either seeded warehouse because their locations and documents are used by the rest of the walkthrough.
4. **Locations** (`/locations`): open the URL directly. Search `A-01`, filter by `North Distribution Centre`, and select **View stock**. Initially the cable shows 8 on hand, 2 reserved, and 6 free to use; the adapter shows 25 on hand, 3 reserved, and 22 free to use; the keyboard shows 5 on hand, 1 reserved, and 4 free to use. Filter by the South warehouse to see mouse and headset stock there.
5. **Receipts** (`/receipts`): select `DEMO-RCP-001`, a draft for 12 received USB-C cables, or `DEMO-RCP-002`, a ready receipt for 10 keyboards from Demo Supply Co. Choose **Validate & Receive Stock** and confirm. The selected receipt becomes done, its product stock increases, and the backend records the stock movement and ledger entry in one transaction. Validating the cable receipt changes cable stock from 8 to 20; validating the keyboard receipt changes keyboard stock from 5 to 15. Refresh the dashboard: pending receipts decreases by one, and the matching product leaves low stock.
6. **Logout and staff role**: log out, create a second account as `warehouse_staff`, and sign in. Confirm categories and warehouse data remain readable while manager-only create/edit controls are hidden. The API also enforces manager-only receipt validation.

The receipt page's **New Receipt** button currently creates an empty draft using hard-coded warehouse/location IDs. For the complete receipt demo, use the seeded `DEMO-RCP-001` record rather than that button; the current page has no line editor to finish a newly created receipt.

## Optional Receipt API Demo

The backend supports receipt line changes even though the current page does not expose them. With an access token from login, the relevant endpoints are:

```text
GET    /api/v1/receipts
GET    /api/v1/receipts/:id
POST   /api/v1/receipts
PATCH  /api/v1/receipts/:id
POST   /api/v1/receipts/:id/lines
PATCH  /api/v1/receipts/:id/lines/:lineId
DELETE /api/v1/receipts/:id/lines/:lineId
POST   /api/v1/receipts/:id/validate
```

Send `Authorization: Bearer <accessToken>` for protected requests. A line body uses `product_id`, `qty_expected`, and `unit_cost`; recording actual received quantity uses `qty_received`. Validation requires at least one line and a destination location. Do not validate the seeded receipt more than once; completed receipts are immutable.

## Resetting The Demo

Use a disposable local database. To repeat the exact initial KPI values after the receipt has been completed, drop and recreate only that demo database, then rerun migrations, the reference seeder, signup, and the SQL script. Do not delete or reset stock rows independently of `stock_ledger_entries`; inventory changes are meant to stay auditable.