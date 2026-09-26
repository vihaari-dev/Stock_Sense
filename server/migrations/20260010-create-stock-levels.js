"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stock_levels", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "products", key: "id" }, onDelete: "RESTRICT" },
      location_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "locations", key: "id" }, onDelete: "RESTRICT" },
      on_hand: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      reserved: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("stock_levels", ["product_id", "location_id"], { unique: true, name: "uq_stock_levels_product_location" });
    await queryInterface.addIndex("stock_levels", ["product_id"], { name: "idx_stock_levels_product" });
    await queryInterface.addIndex("stock_levels", ["location_id"], { name: "idx_stock_levels_location" });
  },
  async down(queryInterface) { await queryInterface.dropTable("stock_levels"); },
};
