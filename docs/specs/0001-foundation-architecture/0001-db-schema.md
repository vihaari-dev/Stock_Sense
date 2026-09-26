# 0001. Database Schema: StockSense

## Summary

StockSense uses a fully normalized MySQL 8.x relational database organized into five logical domains: identity and access, master data (products, categories, warehouses, locations), stock state (the live inventory view), operational documents (receipts, deliveries, transfers, adjustments), and the stock ledger (the immutable audit trail). Every stock-changing action writes to the ledger in the same transaction as the stock state update. No stock is ever mutated silently. The schema is 3NF throughout with intentional, documented denormalizations only for performance on the movement history view.

## Context

The central product invariant is: every stock-changing event must be traceable and auditable. This drives three separations the schema must enforce:

1. Product master data (what a product IS) is separate from stock state (how much of it exists, where).
2. Operational documents are separate from their line items (products and quantities they touch).
3. The stock ledger (append-only) is separate from the live stock state (current quantity per product per location).

The schema must also support: multi-warehouse inventory, location-aware stock, two user roles, human-readable document references (warehouse code + operation type + ID), reorder threshold rules, low-stock detection, and Kanban/list views grouped by document status.

---

## Domain 1: Identity and Access

```sql
-- TABLE: users
CREATE TABLE users (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    login_id      VARCHAR(12)     NOT NULL COMMENT 'Unique login ID, 6-12 chars',
    email         VARCHAR(255)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL COMMENT 'bcrypt hash',
    role          ENUM('inventory_manager','warehouse_staff') NOT NULL,
    full_name     VARCHAR(150)    NOT NULL,
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_login_id (login_id),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT chk_users_login_id_length CHECK (CHAR_LENGTH(login_id) BETWEEN 6 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: refresh_tokens
CREATE TABLE refresh_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token_hash  VARCHAR(255) NOT NULL COMMENT 'SHA-256 of opaque token',
    expires_at  DATETIME     NOT NULL,
    revoked_at  DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_tokens_hash (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: otp_codes
CREATE TABLE otp_codes (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    code_hash   VARCHAR(255) NOT NULL COMMENT 'SHA-256 of the 6-digit OTP',
    expires_at  DATETIME     NOT NULL,
    used_at     DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_otp_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_otp_codes_user (user_id),
    INDEX idx_otp_codes_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```


## Domain 2: Master Data

```sql
-- TABLE: categories
CREATE TABLE categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    parent_id   BIGINT       NULL COMMENT 'NULL = top-level category',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE RESTRICT,
    INDEX idx_categories_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: units_of_measure
CREATE TABLE units_of_measure (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    name         VARCHAR(50) NOT NULL COMMENT 'e.g. Piece, Kilogram, Litre',
    abbreviation VARCHAR(10) NOT NULL COMMENT 'e.g. pcs, kg, L',
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_uom_name (name),
    UNIQUE KEY uq_uom_abbreviation (abbreviation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: products
-- Product master data. Describes WHAT a product IS.
-- Stock quantities live in stock_levels, NOT here.
CREATE TABLE products (
    id            BIGINT         NOT NULL AUTO_INCREMENT,
    sku           VARCHAR(100)   NOT NULL COMMENT 'Stock Keeping Unit, human-readable',
    name          VARCHAR(255)   NOT NULL,
    description   TEXT           NULL,
    category_id   BIGINT         NOT NULL,
    uom_id        BIGINT         NOT NULL,
    unit_cost     DECIMAL(12,4)  NOT NULL DEFAULT 0.0000 COMMENT 'Per-unit cost for valuation',
    reorder_point INT            NOT NULL DEFAULT 0 COMMENT 'Low-stock threshold; 0 = no alert',
    reorder_qty   INT            NOT NULL DEFAULT 0 COMMENT 'Suggested replenishment quantity',
    is_active     TINYINT(1)     NOT NULL DEFAULT 1,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_sku (sku),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_uom FOREIGN KEY (uom_id) REFERENCES units_of_measure (id) ON DELETE RESTRICT,
    CONSTRAINT chk_products_unit_cost CHECK (unit_cost >= 0),
    CONSTRAINT chk_products_reorder_point CHECK (reorder_point >= 0),
    CONSTRAINT chk_products_reorder_qty CHECK (reorder_qty >= 0),
    INDEX idx_products_category (category_id),
    INDEX idx_products_uom (uom_id),
    FULLTEXT INDEX ft_products_search (sku, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: warehouses
CREATE TABLE warehouses (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(10)  NOT NULL COMMENT 'Short code used in document references, e.g. WH01',
    address     TEXT         NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_warehouses_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: locations
-- Physical storage areas inside a warehouse (rack, shelf, room, zone).
CREATE TABLE locations (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    warehouse_id BIGINT       NOT NULL,
    name         VARCHAR(150) NOT NULL,
    code         VARCHAR(20)  NOT NULL COMMENT 'Short code, e.g. A1, RACK-03',
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_locations_warehouse_code (warehouse_id, code),
    CONSTRAINT fk_locations_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE RESTRICT,
    INDEX idx_locations_warehouse (warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: contacts
-- Lightweight contact reference for receipts/deliveries. Not a full CRM object.
CREATE TABLE contacts (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(255) NULL,
    phone       VARCHAR(30)  NULL,
    address     TEXT         NULL,
    type        ENUM('supplier','customer','other') NOT NULL DEFAULT 'other',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_contacts_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```


## Domain 3: Stock State (Live Inventory)

```sql
-- TABLE: stock_levels
-- The LIVE stock state: quantity per product per location.
-- on_hand = total physical quantity at this location.
-- reserved = quantity committed to ready/validated deliveries (future use).
-- free_to_use = on_hand - reserved (computed by application or view).
-- INVARIANT: on_hand >= 0, reserved >= 0, on_hand >= reserved.
CREATE TABLE stock_levels (
    id          BIGINT    NOT NULL AUTO_INCREMENT,
    product_id  BIGINT    NOT NULL,
    location_id BIGINT    NOT NULL,
    on_hand     INT       NOT NULL DEFAULT 0,
    reserved    INT       NOT NULL DEFAULT 0,
    created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_stock_levels_product_location (product_id, location_id),
    CONSTRAINT fk_stock_levels_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_levels_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE RESTRICT,
    CONSTRAINT chk_stock_levels_on_hand CHECK (on_hand >= 0),
    CONSTRAINT chk_stock_levels_reserved CHECK (reserved >= 0),
    CONSTRAINT chk_stock_levels_free CHECK (on_hand >= reserved),
    INDEX idx_stock_levels_product (product_id),
    INDEX idx_stock_levels_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Domain 4: Operational Documents

```sql
-- TABLE: receipts
-- Incoming goods. Stock increases on transition to done.
-- Reference format: <warehouse_code>-RCP-<zero_padded_id>  e.g. WH01-RCP-0042
CREATE TABLE receipts (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    reference               VARCHAR(50)  NOT NULL,
    warehouse_id            BIGINT       NOT NULL COMMENT 'Destination warehouse',
    destination_location_id BIGINT       NULL     COMMENT 'Specific shelving location; nullable',
    contact_id              BIGINT       NULL     COMMENT 'Supplier reference',
    responsible_user_id     BIGINT       NOT NULL,
    status                  ENUM('draft','ready','done','canceled') NOT NULL DEFAULT 'draft',
    scheduled_date          DATE         NULL,
    completed_at            DATETIME     NULL,
    notes                   TEXT         NULL,
    created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_receipts_reference (reference),
    CONSTRAINT fk_receipts_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE RESTRICT,
    CONSTRAINT fk_receipts_location FOREIGN KEY (destination_location_id) REFERENCES locations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_receipts_contact FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL,
    CONSTRAINT fk_receipts_responsible FOREIGN KEY (responsible_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_receipts_warehouse (warehouse_id),
    INDEX idx_receipts_status (status),
    INDEX idx_receipts_responsible (responsible_user_id),
    INDEX idx_receipts_scheduled_date (scheduled_date),
    INDEX idx_receipts_contact (contact_id),
    FULLTEXT INDEX ft_receipts_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: receipt_lines
-- One row per product in a receipt.
-- unit_cost is a snapshot of product.unit_cost at receipt time (intentional denorm).
CREATE TABLE receipt_lines (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    receipt_id   BIGINT        NOT NULL,
    product_id   BIGINT        NOT NULL,
    qty_expected INT           NOT NULL DEFAULT 0,
    qty_received INT           NOT NULL DEFAULT 0,
    unit_cost    DECIMAL(12,4) NOT NULL COMMENT 'Snapshot at receipt time',
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_receipt_lines_receipt_product (receipt_id, product_id),
    CONSTRAINT fk_receipt_lines_receipt FOREIGN KEY (receipt_id) REFERENCES receipts (id) ON DELETE CASCADE,
    CONSTRAINT fk_receipt_lines_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT chk_receipt_lines_qty_expected CHECK (qty_expected >= 0),
    CONSTRAINT chk_receipt_lines_qty_received CHECK (qty_received >= 0),
    INDEX idx_receipt_lines_receipt (receipt_id),
    INDEX idx_receipt_lines_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: deliveries
-- Outgoing goods. Stock decreases on done. Waiting = blocked (no stock).
-- Reference format: <warehouse_code>-DEL-<zero_padded_id>
CREATE TABLE deliveries (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    reference           VARCHAR(50)  NOT NULL,
    warehouse_id        BIGINT       NOT NULL COMMENT 'Source warehouse',
    source_location_id  BIGINT       NULL,
    contact_id          BIGINT       NULL,
    delivery_address    TEXT         NULL,
    responsible_user_id BIGINT       NOT NULL,
    status              ENUM('draft','waiting','ready','done','canceled') NOT NULL DEFAULT 'draft',
    scheduled_date      DATE         NULL,
    completed_at        DATETIME     NULL,
    notes               TEXT         NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_deliveries_reference (reference),
    CONSTRAINT fk_deliveries_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE RESTRICT,
    CONSTRAINT fk_deliveries_location FOREIGN KEY (source_location_id) REFERENCES locations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_deliveries_contact FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL,
    CONSTRAINT fk_deliveries_responsible FOREIGN KEY (responsible_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_deliveries_warehouse (warehouse_id),
    INDEX idx_deliveries_status (status),
    INDEX idx_deliveries_responsible (responsible_user_id),
    INDEX idx_deliveries_scheduled_date (scheduled_date),
    INDEX idx_deliveries_contact (contact_id),
    FULLTEXT INDEX ft_deliveries_reference (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: delivery_lines
-- is_available: 0 = stock insufficient (shown red in UI). Cached to avoid join on list load.
CREATE TABLE delivery_lines (
    id            BIGINT     NOT NULL AUTO_INCREMENT,
    delivery_id   BIGINT     NOT NULL,
    product_id    BIGINT     NOT NULL,
    qty_requested INT        NOT NULL,
    qty_delivered INT        NOT NULL DEFAULT 0,
    is_available  TINYINT(1) NOT NULL DEFAULT 1,
    created_at    DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_delivery_lines_delivery_product (delivery_id, product_id),
    CONSTRAINT fk_delivery_lines_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries (id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_lines_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT chk_delivery_lines_qty_requested CHECK (qty_requested > 0),
    CONSTRAINT chk_delivery_lines_qty_delivered CHECK (qty_delivered >= 0),
    INDEX idx_delivery_lines_delivery (delivery_id),
    INDEX idx_delivery_lines_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: transfers
-- Internal movement between locations. Total qty unchanged.
-- Reference format: <source_warehouse_code>-TRF-<zero_padded_id>
CREATE TABLE transfers (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    reference               VARCHAR(50)  NOT NULL,
    source_location_id      BIGINT       NOT NULL,
    destination_location_id BIGINT       NOT NULL,
    responsible_user_id     BIGINT       NOT NULL,
    status                  ENUM('draft','ready','done','canceled') NOT NULL DEFAULT 'draft',
    scheduled_date          DATE         NULL,
    completed_at            DATETIME     NULL,
    notes                   TEXT         NULL,
    created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_transfers_reference (reference),
    CONSTRAINT fk_transfers_source_location FOREIGN KEY (source_location_id) REFERENCES locations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_dest_location FOREIGN KEY (destination_location_id) REFERENCES locations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_responsible FOREIGN KEY (responsible_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_transfers_locations_differ CHECK (source_location_id <> destination_location_id),
    INDEX idx_transfers_source (source_location_id),
    INDEX idx_transfers_dest (destination_location_id),
    INDEX idx_transfers_status (status),
    INDEX idx_transfers_responsible (responsible_user_id),
    INDEX idx_transfers_scheduled_date (scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: transfer_lines
CREATE TABLE transfer_lines (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    transfer_id BIGINT   NOT NULL,
    product_id  BIGINT   NOT NULL,
    qty         INT      NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_transfer_lines_transfer_product (transfer_id, product_id),
    CONSTRAINT fk_transfer_lines_transfer FOREIGN KEY (transfer_id) REFERENCES transfers (id) ON DELETE CASCADE,
    CONSTRAINT fk_transfer_lines_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT chk_transfer_lines_qty CHECK (qty > 0),
    INDEX idx_transfer_lines_transfer (transfer_id),
    INDEX idx_transfer_lines_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: adjustments
-- Stock reconciliation: physical count vs recorded quantity.
-- Reference format: <warehouse_code>-ADJ-<zero_padded_id>
CREATE TABLE adjustments (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    reference           VARCHAR(50)  NOT NULL,
    location_id         BIGINT       NOT NULL,
    responsible_user_id BIGINT       NOT NULL,
    status              ENUM('draft','done','canceled') NOT NULL DEFAULT 'draft',
    completed_at        DATETIME     NULL,
    notes               TEXT         NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_adjustments_reference (reference),
    CONSTRAINT fk_adjustments_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_adjustments_responsible FOREIGN KEY (responsible_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_adjustments_location (location_id),
    INDEX idx_adjustments_status (status),
    INDEX idx_adjustments_responsible (responsible_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: adjustment_lines
-- delta = qty_counted - qty_recorded (stored, not recomputed).
CREATE TABLE adjustment_lines (
    id            BIGINT   NOT NULL AUTO_INCREMENT,
    adjustment_id BIGINT   NOT NULL,
    product_id    BIGINT   NOT NULL,
    qty_recorded  INT      NOT NULL COMMENT 'on_hand snapshot at time of count',
    qty_counted   INT      NOT NULL,
    delta         INT      NOT NULL COMMENT 'qty_counted - qty_recorded; can be negative',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_adjustment_lines_adjustment_product (adjustment_id, product_id),
    CONSTRAINT fk_adjustment_lines_adjustment FOREIGN KEY (adjustment_id) REFERENCES adjustments (id) ON DELETE CASCADE,
    CONSTRAINT fk_adjustment_lines_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT chk_adjustment_lines_qty_counted CHECK (qty_counted >= 0),
    INDEX idx_adjustment_lines_adjustment (adjustment_id),
    INDEX idx_adjustment_lines_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```


## Domain 5: Stock Ledger (Immutable Audit Trail)

```sql
-- TABLE: stock_ledger_entries
-- Append-only. Every stock-changing event writes here in the SAME
-- transaction as the stock_levels update. Never updated or deleted.
-- document_reference is denormalized for fast history display.
CREATE TABLE stock_ledger_entries (
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    product_id         BIGINT        NOT NULL,
    location_id        BIGINT        NOT NULL,
    operation_type     ENUM('receipt','delivery','transfer_out','transfer_in','adjustment','initial') NOT NULL,
    document_type      ENUM('receipt','delivery','transfer','adjustment') NOT NULL,
    document_id        BIGINT        NOT NULL COMMENT 'ID of the parent operational document',
    document_reference VARCHAR(50)   NOT NULL COMMENT 'Denormalized reference string for display',
    qty_delta          INT           NOT NULL COMMENT 'Positive = stock in, Negative = stock out',
    qty_after          INT           NOT NULL COMMENT 'on_hand AFTER this movement was applied',
    unit_cost_snapshot DECIMAL(12,4) NOT NULL COMMENT 'product.unit_cost at time of movement',
    performed_by       BIGINT        NOT NULL COMMENT 'User who triggered the event',
    occurred_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_ledger_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_user FOREIGN KEY (performed_by) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_ledger_product (product_id),
    INDEX idx_ledger_location (location_id),
    INDEX idx_ledger_document (document_type, document_id),
    INDEX idx_ledger_occurred_at (occurred_at),
    INDEX idx_ledger_performed_by (performed_by),
    INDEX idx_ledger_product_location (product_id, location_id),
    INDEX idx_ledger_operation_type (operation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Migration Order

Run in this exact order to satisfy foreign key dependencies:

1. units_of_measure
2. categories
3. users
4. warehouses
5. locations
6. contacts
7. products
8. refresh_tokens
9. otp_codes
10. stock_levels
11. receipts
12. receipt_lines
13. deliveries
14. delivery_lines
15. transfers
16. transfer_lines
17. adjustments
18. adjustment_lines
19. stock_ledger_entries

---

## Seed Data Required

```sql
-- Units of measure
INSERT INTO units_of_measure (name, abbreviation) VALUES
  ('Piece', 'pcs'),
  ('Kilogram', 'kg'),
  ('Litre', 'L'),
  ('Box', 'box'),
  ('Carton', 'ctn');

-- Default admin user (change password immediately)
-- password_hash is bcrypt of 'Admin@123!' - REPLACE before production
INSERT INTO users (login_id, email, password_hash, role, full_name)
VALUES ('admin1', 'admin@stocksense.local', '$2b$12$PLACEHOLDER_HASH', 'inventory_manager', 'System Admin');
```

---

## Entity Relationship Summary

```
users (1) ──< refresh_tokens (N)
users (1) ──< otp_codes (N)
users (1) ──< receipts.responsible_user_id (N)
users (1) ──< deliveries.responsible_user_id (N)
users (1) ──< transfers.responsible_user_id (N)
users (1) ──< adjustments.responsible_user_id (N)
users (1) ──< stock_ledger_entries.performed_by (N)

categories (1) ──< categories.parent_id (N)  [self-ref]
categories (1) ──< products (N)
units_of_measure (1) ──< products (N)

warehouses (1) ──< locations (N)
warehouses (1) ──< receipts (N)
warehouses (1) ──< deliveries (N)

locations (1) ──< stock_levels (N)
locations (1) ──< receipts.destination_location_id (N)
locations (1) ──< deliveries.source_location_id (N)
locations (1) ──< transfers.source_location_id (N)
locations (1) ──< transfers.destination_location_id (N)
locations (1) ──< adjustments (N)
locations (1) ──< stock_ledger_entries (N)

products (1) ──< stock_levels (N)
products (1) ──< receipt_lines (N)
products (1) ──< delivery_lines (N)
products (1) ──< transfer_lines (N)
products (1) ──< adjustment_lines (N)
products (1) ──< stock_ledger_entries (N)

contacts (1) ──< receipts (N)
contacts (1) ──< deliveries (N)

receipts (1) ──< receipt_lines (N)
deliveries (1) ──< delivery_lines (N)
transfers (1) ──< transfer_lines (N)
adjustments (1) ──< adjustment_lines (N)
```

---

## Normalization Analysis

| Table | Form | Justification |
|---|---|---|
| users | 3NF | All fields depend only on id |
| refresh_tokens | 3NF | All fields depend only on id; user_id is FK |
| categories | 3NF | Self-referencing parent_id is FK, not derived |
| units_of_measure | 3NF | Simple lookup; name and abbreviation are independent |
| products | 3NF | unit_cost is master data attribute; reorder thresholds are product-level |
| warehouses | 3NF | All fields depend only on id |
| locations | 3NF | code is unique within warehouse_id; no transitive deps |
| contacts | 3NF | All fields depend only on id |
| stock_levels | 3NF | Natural composite key (product_id, location_id); reserved and on_hand are additive state |
| receipts | 3NF | Header fields only; reference stored on create (intentional) |
| receipt_lines | 3NF | Composite unique on receipt+product; unit_cost is snapshot (intentional) |
| delivery_lines | 3NF | is_available is cached derived state (intentional denorm for list performance) |
| adjustment_lines | 3NF | delta stored to avoid recomputing in audit queries (intentional) |
| stock_ledger_entries | Near-3NF | document_reference denormalized for audit display performance (documented) |

**Intentional denormalizations (justified)**:
- `receipt_lines.unit_cost`: point-in-time cost snapshot so historical reports reflect actual receipt cost
- `delivery_lines.is_available`: cached availability flag drives Kanban red-line display without stock JOIN on every list load
- `adjustment_lines.delta`: stored to avoid recomputation in audit queries; computed deterministically from two other fields
- `stock_ledger_entries.document_reference`: denormalized reference string avoids joining all four document tables on every movement history page load

---

## Key Invariants

| Invariant | Where Enforced |
|---|---|
| stock_levels.on_hand is never negative | CHECK constraint + application pre-validation |
| stock_levels.on_hand >= stock_levels.reserved | CHECK constraint |
| Every stock change writes to stock_ledger_entries in same transaction | Application transaction; never optional |
| A done document cannot be re-validated | Application state machine guards |
| Transfer source and destination locations must differ | CHECK constraint on transfers |
| Delivery in waiting/done status does not silently mutate stock | State machine validation before ledger write |
| Adjustment delta = qty_counted - qty_recorded | Application computes before insert |

---

## Verification Checklist

- [x] Every table has a primary key
- [x] All relationships have FK constraints with explicit ON DELETE strategy
- [x] Indexes on all foreign keys
- [x] Indexes on status columns (all operational documents)
- [x] Indexes on scheduled_date (for late/upcoming dashboard stats)
- [x] Indexes on product_id + location_id composite (ledger queries)
- [x] DECIMAL(12,4) for all money/cost fields
- [x] NOT NULL on all required fields
- [x] UNIQUE constraints on codes, references, login_id, email, SKU
- [x] CHECK constraints for non-negativity, qty > 0 where required, location diff on transfers
- [x] created_at and updated_at on all mutable tables
- [x] FULLTEXT index on products(sku, name) and document references
- [x] Intentional denormalizations documented with rationale

