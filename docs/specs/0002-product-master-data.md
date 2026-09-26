# 0002. Product Master Data

**Date**: 2026-09-26
**Status**: In Progress

## Summary

Product master data defines what each product is in StockSense. It provides the catalog foundation for all incoming and outgoing inventory operations, including receipts, delivery orders, internal transfers, and physical count adjustments. This feature delivers the backend Sequelize models, controllers, express validator schemas, REST endpoints, and the React frontend interface to list, search, filter, view, create, edit, and deactivate products, along with viewing per location stock levels.

## Requirements

- **AC-1 (List and Pagination)**: Users can view a paginated list of products with SKU, name, category, unit of measure, unit cost, reorder point, reorder quantity, active status, and total on hand stock.
- **AC-2 (Search and Filter)**: Users can search products by SKU or name, and filter products by category and active status.
- **AC-3 (Create Product)**: Inventory managers can create a new product with unique SKU, name, description, category, unit of measure, unit cost, reorder point, and reorder quantity.
- **AC-4 (Update Product)**: Inventory managers can edit existing product details. SKU uniqueness is enforced across all other products.
- **AC-5 (Deactivate / Soft Delete)**: Inventory managers can deactivate a product, setting `is_active` to false, preserving historical ledger entries and reference integrity.
- **AC-6 (Per Location Stock View)**: Users can inspect the breakdown of on hand, reserved, and free to use stock per warehouse and location for any selected product.
- **AC-7 (Role Permissions)**: Warehouse staff can view products and stock levels. Only inventory managers can create, update, or deactivate products. When auth is bypassed or token is optional in development, sensible defaults apply.

## Decision

**Chosen Option**: Full stack Product Master Data implementation matching Foundation Architecture 0001.

### Backend Structure
1. **Models**:
   - `Product` (`server/src/models/Product.ts`): maps to `products` table.
   - `Category` (`server/src/models/Category.ts`): maps to `categories` table.
   - `UnitOfMeasure` (`server/src/models/UnitOfMeasure.ts`): maps to `units_of_measure` table.
   - `StockLevel` (`server/src/models/StockLevel.ts`): maps to `stock_levels` table.
   - Associations established in `server/src/models/index.ts`.
2. **Controller & Services**:
   - `server/src/controllers/productController.ts`: handlers for list, get by id, create, update, delete, and stock breakdown.
3. **Validation**:
   - `server/src/middleware/productValidation.ts`: express validator rules for SKU format, required fields, and non negative numbers.
4. **Routes**:
   - `server/src/routes/products.ts`: mounted at `/api/v1/products`.
   - `server/src/routes/categories.ts`: mounted at `/api/v1/categories` (read list for dropdowns).
   - `server/src/routes/uom.ts`: mounted at `/api/v1/uom` (read list for dropdowns).

### Frontend Structure
1. **API Layer**:
   - `client/src/api/products.ts`: typed Axios functions for fetching, creating, editing, and checking stock.
   - `client/src/types/product.ts`: shared TypeScript interfaces.
2. **UI Components & Pages**:
   - `client/src/pages/ProductsPage.tsx`: main products management page with header, metric summary cards, search bar, category filter, active toggle, action buttons, and responsive data table.
   - `client/src/components/products/ProductModal.tsx`: modal for creating and editing products with validation and category/UOM selectors.
   - `client/src/components/products/ProductStockModal.tsx`: modal displaying per location stock breakdown (on hand, reserved, free to use, warehouse, and location).
3. **Styling & Aesthetics**:
   - Clean, modern design with subtle shadows, status pills, hover states, empty state views, and clear typography.

## Build plan

1. **Step 1: Backend Sequelize Models & Associations**:
   - Create `Category`, `UnitOfMeasure`, `Product`, `StockLevel`, `Warehouse`, and `Location` models.
   - Wire up relationships (`Product.belongsTo(Category)`, `Product.belongsTo(UnitOfMeasure)`, `Product.hasMany(StockLevel)`).
2. **Step 2: Backend Routes, Controllers & Validation**:
   - Implement `productController.ts` with pagination, search, category filter, and location stock calculation.
   - Add auxiliary routes for `categories` and `uom` so the frontend form has lookup options.
   - Mount routes in `server/src/app.ts`.
3. **Step 3: Frontend API Client & Types**:
   - Create `client/src/types/product.ts`.
   - Create `client/src/api/products.ts`.
4. **Step 4: Frontend UI Components**:
   - Build `ProductsPage.tsx`, `ProductModal.tsx`, `ProductStockModal.tsx`.
   - Update navigation and App routing in `client/src/App.tsx`.
5. **Step 5: End to End Verification**:
   - Test product creation, SKU collision check, updating, search, filtering, and stock modal.

## Consequences

- Direct alignment with `0001-foundation-architecture` schema and API specs.
- Provides immediate utility for downstream features (receipts, delivery orders, internal transfers, adjustments).
- Safe deactivation preserves ledger history without breaking foreign key constraints.
