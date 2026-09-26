-- Local/demo database only. Run after migrations and the reference-data seeder.
-- Create an inventory_manager account in /signup before running this script.
-- The script prefers login_id 'demo_mgr', then falls back to another manager.

USE stocksense_dev;

SET @manager_id := (
  SELECT id
  FROM users
  WHERE role = 'inventory_manager'
  ORDER BY CASE WHEN login_id = 'demo_mgr' THEN 0 ELSE 1 END, id
  LIMIT 1
);

SELECT @manager_id AS demo_manager_id;

START TRANSACTION;

-- The reference seeder normally creates these units; this also makes the script
-- usable if the reference seeder was skipped.
INSERT INTO units_of_measure (name, abbreviation, created_at)
VALUES ('Piece', 'pcs', NOW())
ON DUPLICATE KEY UPDATE abbreviation = VALUES(abbreviation);

SET @piece_uom_id := (SELECT id FROM units_of_measure WHERE abbreviation = 'pcs' LIMIT 1);

INSERT INTO categories (name, parent_id, created_at, updated_at)
VALUES ('Demo Electronics', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), updated_at = NOW();
SET @electronics_category_id := LAST_INSERT_ID();

INSERT INTO categories (name, parent_id, created_at, updated_at)
VALUES ('Demo Cables', @electronics_category_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), parent_id = @electronics_category_id, updated_at = NOW();
SET @cables_category_id := LAST_INSERT_ID();

INSERT INTO warehouses (name, code, address, is_active, created_at, updated_at)
VALUES ('North Distribution Centre', 'DEMO-N', '14 North Industrial Road', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'North Distribution Centre', address = '14 North Industrial Road', is_active = 1, updated_at = NOW();
SET @north_warehouse_id := LAST_INSERT_ID();

INSERT INTO warehouses (name, code, address, is_active, created_at, updated_at)
VALUES ('South Distribution Centre', 'DEMO-S', '82 South Commerce Avenue', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'South Distribution Centre', address = '82 South Commerce Avenue', is_active = 1, updated_at = NOW();
SET @south_warehouse_id := LAST_INSERT_ID();

INSERT INTO locations (warehouse_id, name, code, is_active, created_at, updated_at)
VALUES (@north_warehouse_id, 'Cable Rack A1', 'A-01', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'Cable Rack A1', is_active = 1, updated_at = NOW();
SET @north_location_id := LAST_INSERT_ID();

INSERT INTO locations (warehouse_id, name, code, is_active, created_at, updated_at)
VALUES (@south_warehouse_id, 'Small Parts Bin B2', 'B-02', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'Small Parts Bin B2', is_active = 1, updated_at = NOW();
SET @south_location_id := LAST_INSERT_ID();

INSERT INTO products
  (sku, name, description, category_id, uom_id, unit_cost, reorder_point, reorder_qty, is_active, created_at, updated_at)
VALUES
  ('DEMO-CBL-001', 'USB-C Cable 1m', 'Braided USB-C charging cable', @cables_category_id, @piece_uom_id, 4.2500, 10, 30, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'USB-C Cable 1m', category_id = @cables_category_id, uom_id = @piece_uom_id, unit_cost = 4.2500, reorder_point = 10, is_active = 1, updated_at = NOW();
SET @cable_product_id := LAST_INSERT_ID();

INSERT INTO products
  (sku, name, description, category_id, uom_id, unit_cost, reorder_point, reorder_qty, is_active, created_at, updated_at)
VALUES
  ('DEMO-ADP-001', 'USB-C Power Adapter', '30W wall power adapter', @electronics_category_id, @piece_uom_id, 12.5000, 15, 40, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'USB-C Power Adapter', category_id = @electronics_category_id, uom_id = @piece_uom_id, unit_cost = 12.5000, reorder_point = 15, is_active = 1, updated_at = NOW();
SET @adapter_product_id := LAST_INSERT_ID();

INSERT INTO products
  (sku, name, description, category_id, uom_id, unit_cost, reorder_point, reorder_qty, is_active, created_at, updated_at)
VALUES
  ('DEMO-BAT-001', 'Portable Battery Pack', '10,000 mAh battery pack', @electronics_category_id, @piece_uom_id, 21.0000, 8, 20, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'Portable Battery Pack', category_id = @electronics_category_id, uom_id = @piece_uom_id, unit_cost = 21.0000, reorder_point = 8, is_active = 1, updated_at = NOW();
SET @battery_product_id := LAST_INSERT_ID();

INSERT INTO products
  (sku, name, description, category_id, uom_id, unit_cost, reorder_point, reorder_qty, is_active, created_at, updated_at)
VALUES
  ('DEMO-KBD-001', 'Wired Keyboard', 'Full-size USB keyboard', @electronics_category_id, @piece_uom_id, 18.5000, 12, 30, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'Wired Keyboard', category_id = @electronics_category_id, uom_id = @piece_uom_id, unit_cost = 18.5000, reorder_point = 12, is_active = 1, updated_at = NOW();
SET @keyboard_product_id := LAST_INSERT_ID();

INSERT INTO products
  (sku, name, description, category_id, uom_id, unit_cost, reorder_point, reorder_qty, is_active, created_at, updated_at)
VALUES
  ('DEMO-MSE-001', 'Wireless Mouse', '2.4 GHz wireless mouse', @electronics_category_id, @piece_uom_id, 11.0000, 10, 25, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'Wireless Mouse', category_id = @electronics_category_id, uom_id = @piece_uom_id, unit_cost = 11.0000, reorder_point = 10, is_active = 1, updated_at = NOW();
SET @mouse_product_id := LAST_INSERT_ID();

INSERT INTO products
  (sku, name, description, category_id, uom_id, unit_cost, reorder_point, reorder_qty, is_active, created_at, updated_at)
VALUES
  ('DEMO-HDP-001', 'Office Headset', 'Wired headset with microphone', @electronics_category_id, @piece_uom_id, 28.0000, 8, 20, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = 'Office Headset', category_id = @electronics_category_id, uom_id = @piece_uom_id, unit_cost = 28.0000, reorder_point = 8, is_active = 1, updated_at = NOW();
SET @headset_product_id := LAST_INSERT_ID();

INSERT INTO contacts (name, email, phone, address, type, created_at, updated_at)
SELECT 'Demo Supply Co', 'orders@demosupply.example', '+1-555-0100', '100 Sample Street', 'supplier', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE name = 'Demo Supply Co' AND type = 'supplier');
SET @demo_supplier_id := (SELECT id FROM contacts WHERE name = 'Demo Supply Co' AND type = 'supplier' ORDER BY id LIMIT 1);

-- Initial stock fixtures. Do not overwrite an existing quantity on rerun:
-- receipt validation adds stock and writes the matching ledger entry.
INSERT INTO stock_levels (product_id, location_id, on_hand, reserved, created_at, updated_at)
SELECT @cable_product_id, @north_location_id, 8, 2, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM stock_levels WHERE product_id = @cable_product_id AND location_id = @north_location_id
);

INSERT INTO stock_levels (product_id, location_id, on_hand, reserved, created_at, updated_at)
SELECT @adapter_product_id, @north_location_id, 25, 3, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM stock_levels WHERE product_id = @adapter_product_id AND location_id = @north_location_id
);

INSERT INTO stock_levels (product_id, location_id, on_hand, reserved, created_at, updated_at)
SELECT @keyboard_product_id, @north_location_id, 5, 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM stock_levels WHERE product_id = @keyboard_product_id AND location_id = @north_location_id
);

INSERT INTO stock_levels (product_id, location_id, on_hand, reserved, created_at, updated_at)
SELECT @mouse_product_id, @south_location_id, 40, 4, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM stock_levels WHERE product_id = @mouse_product_id AND location_id = @south_location_id
);

INSERT INTO stock_levels (product_id, location_id, on_hand, reserved, created_at, updated_at)
SELECT @headset_product_id, @south_location_id, 16, 2, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM stock_levels WHERE product_id = @headset_product_id AND location_id = @south_location_id
);

-- This receipt is the interactive demo: choose it in Receipts, then validate it.
-- Validation receives 12 more cables and records the movement in the stock ledger.
INSERT INTO receipts
  (reference, warehouse_id, destination_location_id, contact_id, responsible_user_id, status, scheduled_date, completed_at, notes, created_at, updated_at)
SELECT
  'DEMO-RCP-001', @north_warehouse_id, @north_location_id, NULL, @manager_id,
  'draft', CURDATE(), NULL, 'Demo inbound shipment: 12 USB-C cables', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM receipts WHERE reference = 'DEMO-RCP-001');

SET @demo_receipt_id := (SELECT id FROM receipts WHERE reference = 'DEMO-RCP-001' LIMIT 1);

INSERT INTO receipt_lines
  (receipt_id, product_id, qty_expected, qty_received, unit_cost, created_at, updated_at)
SELECT @demo_receipt_id, @cable_product_id, 12, 12, 4.2500, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM receipt_lines WHERE receipt_id = @demo_receipt_id AND product_id = @cable_product_id
);

INSERT INTO receipts
  (reference, warehouse_id, destination_location_id, contact_id, responsible_user_id, status, scheduled_date, completed_at, notes, created_at, updated_at)
SELECT
  'DEMO-RCP-002', @north_warehouse_id, @north_location_id, @demo_supplier_id, @manager_id,
  'ready', DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL, 'Demo supplier shipment: 10 wired keyboards', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM receipts WHERE reference = 'DEMO-RCP-002');

SET @second_demo_receipt_id := (SELECT id FROM receipts WHERE reference = 'DEMO-RCP-002' LIMIT 1);

INSERT INTO receipt_lines
  (receipt_id, product_id, qty_expected, qty_received, unit_cost, created_at, updated_at)
SELECT @second_demo_receipt_id, @keyboard_product_id, 10, 10, 18.5000, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM receipt_lines WHERE receipt_id = @second_demo_receipt_id AND product_id = @keyboard_product_id
);

-- Dashboard-only fixtures. Deliveries and transfers still have no working UI.
INSERT INTO deliveries
  (reference, warehouse_id, source_location_id, contact_id, delivery_address, responsible_user_id, status, scheduled_date, completed_at, notes, created_at, updated_at)
SELECT
  'DEMO-DEL-001', @north_warehouse_id, @north_location_id, NULL,
  'Demo customer address', @manager_id, 'waiting', CURDATE(), NULL,
  'Dashboard fixture: waiting for stock', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM deliveries WHERE reference = 'DEMO-DEL-001');

SET @demo_delivery_id := (SELECT id FROM deliveries WHERE reference = 'DEMO-DEL-001' LIMIT 1);

INSERT INTO delivery_lines
  (delivery_id, product_id, qty_requested, qty_delivered, is_available, created_at, updated_at)
SELECT @demo_delivery_id, @cable_product_id, 12, 0, 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_lines WHERE delivery_id = @demo_delivery_id AND product_id = @cable_product_id
);

INSERT INTO transfers
  (reference, source_location_id, destination_location_id, responsible_user_id, status, scheduled_date, completed_at, notes, created_at, updated_at)
SELECT
  'DEMO-TRF-001', @north_location_id, @south_location_id, @manager_id,
  'ready', CURDATE(), NULL, 'Dashboard fixture: planned internal movement', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM transfers WHERE reference = 'DEMO-TRF-001');

SET @demo_transfer_id := (SELECT id FROM transfers WHERE reference = 'DEMO-TRF-001' LIMIT 1);

INSERT INTO transfer_lines (transfer_id, product_id, qty, created_at, updated_at)
SELECT @demo_transfer_id, @adapter_product_id, 2, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM transfer_lines WHERE transfer_id = @demo_transfer_id AND product_id = @adapter_product_id
);

COMMIT;

-- On a fresh database, expected KPIs are 6 products, 2 low-stock, 1 out-of-stock,
-- 2 pending receipts, 1 pending delivery, 1 scheduled transfer, and 1 waiting operation.
SELECT reference, status FROM receipts WHERE reference IN ('DEMO-RCP-001', 'DEMO-RCP-002') ORDER BY reference;
SELECT reference, status FROM deliveries WHERE reference = 'DEMO-DEL-001';
SELECT reference, status FROM transfers WHERE reference = 'DEMO-TRF-001';
SELECT p.sku, p.name, l.name AS location, sl.on_hand, sl.reserved,
       sl.on_hand - sl.reserved AS free_to_use
FROM stock_levels sl
JOIN products p ON p.id = sl.product_id
JOIN locations l ON l.id = sl.location_id
WHERE p.sku LIKE 'DEMO-%'
ORDER BY p.sku;