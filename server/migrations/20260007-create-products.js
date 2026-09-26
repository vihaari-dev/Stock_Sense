"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("products", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      sku: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "categories", key: "id" }, onDelete: "RESTRICT" },
      uom_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "units_of_measure", key: "id" }, onDelete: "RESTRICT" },
      unit_cost: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 0 },
      reorder_point: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      reorder_qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("products", ["category_id"], { name: "idx_products_category" });
    await queryInterface.addIndex("products", ["uom_id"], { name: "idx_products_uom" });
  },
  async down(queryInterface) { await queryInterface.dropTable("products"); },
};
