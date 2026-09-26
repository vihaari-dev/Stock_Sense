// Authentication models
export * from './User';
export * from './RefreshToken';
export * from './OtpCode';

/**
 * Central model registry.
 * Import all Product Master models here and define associations.
 */

import { Category } from './Category';
import { UnitOfMeasure } from './UnitOfMeasure';
import { Warehouse } from './Warehouse';
import { Location } from './Location';
import { Product } from './Product';
import { StockLevel } from './StockLevel';

// ── Associations ────────────────────────────────────────────────────────────

// Category self-reference (parent/child)
Category.hasMany(Category, {
    foreignKey: 'parent_id',
    as: 'children'
});

Category.belongsTo(Category, {
    foreignKey: 'parent_id',
    as: 'parent'
});

// Product → Category
Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
});

Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products'
});

// Product → UnitOfMeasure
Product.belongsTo(UnitOfMeasure, {
    foreignKey: 'uom_id',
    as: 'uom'
});

UnitOfMeasure.hasMany(Product, {
    foreignKey: 'uom_id',
    as: 'products'
});

// Location → Warehouse
Location.belongsTo(Warehouse, {
    foreignKey: 'warehouse_id',
    as: 'warehouse'
});

Warehouse.hasMany(Location, {
    foreignKey: 'warehouse_id',
    as: 'locations'
});

// StockLevel → Product
StockLevel.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
});

Product.hasMany(StockLevel, {
    foreignKey: 'product_id',
    as: 'stockLevels'
});

// StockLevel → Location
StockLevel.belongsTo(Location, {
    foreignKey: 'location_id',
    as: 'location'
});

Location.hasMany(StockLevel, {
    foreignKey: 'location_id',
    as: 'stockLevels'
});

export {
    Category,
    UnitOfMeasure,
    Warehouse,
    Location,
    Product,
    StockLevel
};