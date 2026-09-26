"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("locations", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      warehouse_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "warehouses", key: "id" }, onDelete: "RESTRICT" },
      name: { type: Sequelize.STRING(150), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false },
      is_active: { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("locations", ["warehouse_id", "code"], { unique: true, name: "uq_locations_warehouse_code" });
    await queryInterface.addIndex("locations", ["warehouse_id"], { name: "idx_locations_warehouse" });
  },
  async down(queryInterface) { await queryInterface.dropTable("locations"); },
};
