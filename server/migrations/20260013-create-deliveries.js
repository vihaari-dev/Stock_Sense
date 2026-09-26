"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("deliveries", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      reference: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      warehouse_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "warehouses", key: "id" }, onDelete: "RESTRICT" },
      source_location_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: "locations", key: "id" }, onDelete: "RESTRICT" },
      contact_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: "contacts", key: "id" }, onDelete: "SET NULL" },
      delivery_address: { type: Sequelize.TEXT, allowNull: true },
      responsible_user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      status: { type: Sequelize.ENUM("draft","waiting","ready","done","canceled"), allowNull: false, defaultValue: "draft" },
      scheduled_date: { type: Sequelize.DATEONLY, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("deliveries", ["warehouse_id"], { name: "idx_deliveries_warehouse" });
    await queryInterface.addIndex("deliveries", ["status"], { name: "idx_deliveries_status" });
    await queryInterface.addIndex("deliveries", ["responsible_user_id"], { name: "idx_deliveries_responsible" });
    await queryInterface.addIndex("deliveries", ["scheduled_date"], { name: "idx_deliveries_scheduled_date" });
    await queryInterface.addIndex("deliveries", ["contact_id"], { name: "idx_deliveries_contact" });
  },
  async down(queryInterface) { await queryInterface.dropTable("deliveries"); },
};
