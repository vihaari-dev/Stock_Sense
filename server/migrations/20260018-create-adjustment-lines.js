"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("adjustment_lines", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      adjustment_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "adjustments", key: "id" }, onDelete: "CASCADE" },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      qty_recorded: { type: Sequelize.INTEGER, allowNull: false },
      qty_counted: { type: Sequelize.INTEGER, allowNull: false },
      delta: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("adjustment_lines", ["adjustment_id", "product_id"], { unique: true, name: "uq_adjustment_lines_adjustment_product" });
    await queryInterface.addIndex("adjustment_lines", ["adjustment_id"], { name: "idx_adjustment_lines_adjustment" });
    await queryInterface.addIndex("adjustment_lines", ["product_id"], { name: "idx_adjustment_lines_product" });
  },
  async down(queryInterface) { await queryInterface.dropTable("adjustment_lines"); },
};
