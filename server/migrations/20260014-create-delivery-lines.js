"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("delivery_lines", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      delivery_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "deliveries", key: "id" }, onDelete: "CASCADE" },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      qty_requested: { type: Sequelize.INTEGER, allowNull: false },
      qty_delivered: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_available: { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("delivery_lines", ["delivery_id", "product_id"], { unique: true, name: "uq_delivery_lines_delivery_product" });
    await queryInterface.addIndex("delivery_lines", ["delivery_id"], { name: "idx_delivery_lines_delivery" });
    await queryInterface.addIndex("delivery_lines", ["product_id"], { name: "idx_delivery_lines_product" });
  },
  async down(queryInterface) { await queryInterface.dropTable("delivery_lines"); },
};
