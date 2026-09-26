"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("receipt_lines", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      receipt_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "receipts", key: "id" }, onDelete: "CASCADE" },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      qty_expected: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      qty_received: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      unit_cost: { type: Sequelize.DECIMAL(12, 4), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("receipt_lines", ["receipt_id", "product_id"], { unique: true, name: "uq_receipt_lines_receipt_product" });
    await queryInterface.addIndex("receipt_lines", ["receipt_id"], { name: "idx_receipt_lines_receipt" });
    await queryInterface.addIndex("receipt_lines", ["product_id"], { name: "idx_receipt_lines_product" });
  },
  async down(queryInterface) { await queryInterface.dropTable("receipt_lines"); },
};
