# 0003. Product Categories

**Date**: 2026-09-26
**Status**: In Progress

## Summary

Product categories let inventory managers organise products into a named hierarchy. Categories are master data — they are created and maintained independently of products, and products reference exactly one category. The feature delivers full CRUD for categories, a flat list page for browsing them, an optional parent-child hierarchy (one level deep for MVP), and the category dropdown used by the product form. Both roles can read categories; only `inventory_manager` can create, update, or delete them.

## Requirements

**User stories**:
- As an inventory manager, I want to create and name a product category so I can organise incoming products before I add them to the catalog.
- As an inventory manager, I want to assign a parent category to a category so I can group related categories together.
- As an inventory manager, I want to rename or delete a category so I can keep the catalog tidy.
- As any user, I want to see all categories in a list so I can understand how products are organised.
- As any user, I want to filter products by category on any screen that supports category filtering.

**Acceptance criteria**:
- **AC-1**: `GET /api/v1/categories` returns a paginated list of all categories with `id`, `name`, `parentId`, `parentName`, and product count. Both roles permitted.
- **AC-2**: `POST /api/v1/categories` creates a category with a unique `name` and an optional `parentId`. Only `inventory_manager` permitted. Returns 409 if name already exists.
- **AC-3**: `GET /api/v1/categories/:id` returns a single category with the same fields as AC-1 plus a list of its direct children.
- **AC-4**: `PATCH /api/v1/categories/:id` updates `name` and/or `parentId`. Only `inventory_manager`. Returns 404 if category not found, 409 if the new name collides, 422 if `parentId` would create a cycle.
- **AC-5**: `DELETE /api/v1/categories/:id` deletes a category only if it has no products assigned and no child categories. Returns 422 with code `CATEGORY_IN_USE` if products are assigned. Returns 422 with code `CATEGORY_HAS_CHILDREN` if child categories exist. Only `inventory_manager`.
- **AC-6**: The frontend renders a Categories list page at `/categories` showing all categories in a table with name, parent, and product count columns. Accessible to both roles.
- **AC-7**: The list page has a "New Category" button (inventory_manager only) that opens a modal/drawer form for create and edit.
- **AC-8**: Delete is possible from the list with a confirmation prompt. Blocked categories show a tooltip explaining why deletion is prevented.
- **AC-9**: All API endpoints return the standard error shape `{ error: { code, message } }`.

## Decision

**Chosen option**: Flat list with optional single-level parent, full CRUD behind role guard.

The `categories` table already supports a `parent_id` self-reference. The MVP exposes a single parent-child level which is enough for product grouping and filtering. Unlimited nesting would require recursive CTE queries and a tree component on the frontend — unnecessary complexity for the current scale. Categories are small master data and are fetched in full for dropdowns; no cursor pagination needed, standard `?page&limit` is sufficient.

## Feature design

**Data model**: No new tables. Uses the already-migrated `categories` table:

```sql
categories (id BIGINT PK, name VARCHAR(100) UNIQUE, parent_id BIGINT NULL FK→categories.id, created_at, updated_at)
```

**API surface**:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /categories | both roles | List all categories (paginated) |
| POST | /categories | inventory_manager | Create category |
| GET | /categories/:id | both roles | Get single category with children |
| PATCH | /categories/:id | inventory_manager | Update name / parent |
| DELETE | /categories/:id | inventory_manager | Delete if safe |

**Response shapes**:

```jsonc
// GET /categories
{
  "data": [
    { "id": 1, "name": "Electronics", "parentId": null, "parentName": null, "productCount": 12 }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
}

// GET /categories/:id
{
  "id": 1, "name": "Electronics", "parentId": null, "parentName": null, "productCount": 12,
  "children": [{ "id": 3, "name": "Mobile Phones", "productCount": 4 }]
}
```

**Key invariants**:
- Category names must be unique across the whole table (enforced by DB unique key and 409 at service layer).
- `parentId` must refer to a top-level category (i.e., a category with `parent_id = NULL`) to keep hierarchy to one level.
- A category with products assigned cannot be deleted.
- A category with child categories cannot be deleted.
- Deletion is irreversible; no soft delete.

**Security model**:
- `requireAuth` on all routes.
- `requireRole('inventory_manager')` on POST / PATCH / DELETE.
- Both roles can GET.

## Build plan

1. Create `server/src/models/Category.ts` — Sequelize model for the `categories` table. Satisfies data layer for all ACs.
2. Create `server/src/services/categoryService.ts` — business logic: list (with COUNT join), getById, create (uniqueness check), update (cycle guard), delete (in-use guard). Satisfies **AC-1 to AC-5**.
3. Create `server/src/controllers/categoryController.ts` — thin handlers calling the service. Satisfies **AC-1 to AC-5, AC-9**.
4. Create `server/src/routes/categories.ts` — router with role guards. Satisfies **AC-1 to AC-5**.
5. Register categories router in `server/src/app.ts` at `/api/v1/categories`. Satisfies **AC-1 to AC-5**.
6. Create `client/src/api/categories.ts` — typed Axios callers. Satisfies **AC-6**.
7. Create `client/src/types/category.ts` — shared frontend types.
8. Create `client/src/pages/CategoriesPage.tsx` + `CategoriesPage.css` — list table, create/edit modal, delete confirmation. Satisfies **AC-6, AC-7, AC-8**.
9. Wire `/categories` route in `client/src/App.tsx` inside `<ProtectedRoute>`. Satisfies **AC-6**.

## Consequences

**Positive**:
- Simple, fast master data — categories rarely change and the full list fits in a single response.
- Single-level parent constraint avoids recursive queries and complex frontend tree rendering.
- Role-gated write access aligns with the auth spec permission matrix.

**Negative / tradeoffs**:
- Single-level hierarchy means deep sub-categories are not supported without a future architecture change.
- No soft delete — deleted categories are gone permanently.

## Follow-up

- [ ] Add category filter to the product list page when Product master data feature is built.
- [ ] Add category to dashboard smart filters.
- [ ] Consider multi-level hierarchy if the business requires it post-MVP.
