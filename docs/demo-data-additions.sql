-- Additional demo records only. Run this after the original docs/demo-data.sql.
-- This file does not reinsert or reset the original demo products, locations, or stock.

USE stocksense_dev;

SET @manager_id := (
  SELECT id
  FROM users
  WHERE role = 'inventory_manager'
  ORDER BY CASE WHEN login_id = 'demo_mgr' THEN 0 ELSE 1 END, id
  LIMIT 1
);
SET @electronics_category_id := (
  SELECT id FROM categories WHERE name = 'Demo Electronics' LIMIT 1
);
SET @piece_uom_id := (
  SELECT id FROM units_of_measure WHERE abbreviation = 'pcs' LIMIT 1
);
SET @north_warehouse_id := (
  SELECT id FROM warehouses WHERE code = 'DEMO-N' LIMIT 1
);
SET @south_warehouse_id := (
  SELECT id FROM warehouses WHERE code = 'DEMO-S' LIMIT 1
);
SET @north_location_id := (
  SELECT id FROM locations WHERE warehouse_id = @north_warehouse_id AND code = 'A-01' LIMIT 1
);
SET @south_location_id := (
  SELECT id FROM locations WHERE warehouse_id = @south_warehouse_id AND code = 'B-02' LIMIT 1
);

-- Check these IDs are non-null before continuing. If any are null, rerun the
-- original demo seed first and confirm an inventory_manager user exists.
SELECT @manager_id AS demo_manager_id,
       @electronics_category_id AS electronics_category_id,
       @piece_uom_id AS piece_uom_id,
       @north_location_id AS north_location_id,
       @south_location_id AS south_location_id;

START TRANSACTION;

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
WHERE NOT EXISTS (
  SELECT 1 FROM contacts WHERE name = 'Demo Supply Co' AND type = 'supplier'
);
SET @demo_supplier_id := (
  SELECT id FROM contacts
  WHERE name = 'Demo Supply Co' AND type = 'supplier'
  ORDER BY id LIMIT 1
);

-- Insert stock only when the product/location pair has no stock row yet.
-- Existing quantities are left unchanged, including any stock received earlier.
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

INSERT INTO receipts
  (reference, warehouse_id, destination_location_id, contact_id, responsible_user_id, status, scheduled_date, completed_at, notes, created_at, updated_at)
SELECT
  'DEMO-RCP-002', @north_warehouse_id, @north_location_id, @demo_supplier_id, @manager_id,
  'ready', DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL,
  'Demo supplier shipment: 10 wired keyboards', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM receipts WHERE reference = 'DEMO-RCP-002'
);

SET @second_demo_receipt_id := (
  SELECT id FROM receipts WHERE reference = 'DEMO-RCP-002' LIMIT 1
);

INSERT INTO receipt_lines
  (receipt_id, product_id, qty_expected, qty_received, unit_cost, created_at, updated_at)
SELECT @second_demo_receipt_id, @keyboard_product_id, 10, 10, 18.5000, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM receipt_lines
  WHERE receipt_id = @second_demo_receipt_id AND product_id = @keyboard_product_id
);

COMMIT;

-- Verify the added records.
SELECT p.sku, p.name, l.name AS location, sl.on_hand, sl.reserved,
       sl.on_hand - sl.reserved AS free_to_use
FROM stock_levels sl
JOIN products p ON p.id = sl.product_id
JOIN locations l ON l.id = sl.location_id
WHERE p.sku IN ('DEMO-KBD-001', 'DEMO-MSE-001', 'DEMO-HDP-001')
ORDER BY p.sku;

SELECT r.reference, r.status, c.name AS supplier,
       p.sku, rl.qty_expected, rl.qty_received
FROM receipts r
JOIN contacts c ON c.id = r.contact_id
JOIN receipt_lines rl ON rl.receipt_id = r.id
JOIN products p ON p.id = rl.product_id
WHERE r.reference = 'DEMO-RCP-002';
