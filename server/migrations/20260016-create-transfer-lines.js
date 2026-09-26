"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transfer_lines", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      transfer_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "transfers", key: "id" }, onDelete: "CASCADE" },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      qty: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("transfer_lines", ["transfer_id", "product_id"], { unique: true, name: "uq_transfer_lines_transfer_product" });
    await queryInterface.addIndex("transfer_lines", ["transfer_id"], { name: "idx_transfer_lines_transfer" });
    await queryInterface.addIndex("transfer_lines", ["product_id"], { name: "idx_transfer_lines_product" });
  },
  async down(queryInterface) { await queryInterface.dropTable("transfer_lines"); },
};
