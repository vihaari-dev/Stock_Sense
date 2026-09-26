"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stock_ledger_entries", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      location_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "locations", key: "id" }, onDelete: "RESTRICT" },
      operation_type: { type: Sequelize.ENUM("receipt","delivery","transfer_out","transfer_in","adjustment","initial"), allowNull: false },
      document_type: { type: Sequelize.ENUM("receipt","delivery","transfer","adjustment"), allowNull: false },
      document_id: { type: Sequelize.BIGINT, allowNull: false },
      document_reference: { type: Sequelize.STRING(50), allowNull: false },
      qty_delta: { type: Sequelize.INTEGER, allowNull: false },
      qty_after: { type: Sequelize.INTEGER, allowNull: false },
      unit_cost_snapshot: { type: Sequelize.DECIMAL(12, 4), allowNull: false },
      performed_by: { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      occurred_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("stock_ledger_entries", ["product_id"], { name: "idx_ledger_product" });
    await queryInterface.addIndex("stock_ledger_entries", ["location_id"], { name: "idx_ledger_location" });
    await queryInterface.addIndex("stock_ledger_entries", ["document_type", "document_id"], { name: "idx_ledger_document" });
    await queryInterface.addIndex("stock_ledger_entries", ["occurred_at"], { name: "idx_ledger_occurred_at" });
    await queryInterface.addIndex("stock_ledger_entries", ["performed_by"], { name: "idx_ledger_performed_by" });
    await queryInterface.addIndex("stock_ledger_entries", ["product_id", "location_id"], { name: "idx_ledger_product_location" });
    await queryInterface.addIndex("stock_ledger_entries", ["operation_type"], { name: "idx_ledger_operation_type" });
  },
  async down(queryInterface) { await queryInterface.dropTable("stock_ledger_entries"); },
};
