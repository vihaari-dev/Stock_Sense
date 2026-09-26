"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("receipts", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      reference: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      warehouse_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "warehouses", key: "id" }, onDelete: "RESTRICT" },
      destination_location_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: "locations", key: "id" }, onDelete: "RESTRICT" },
      contact_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: "contacts", key: "id" }, onDelete: "SET NULL" },
      responsible_user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      status: { type: Sequelize.ENUM("draft","ready","done","canceled"), allowNull: false, defaultValue: "draft" },
      scheduled_date: { type: Sequelize.DATEONLY, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("receipts", ["warehouse_id"], { name: "idx_receipts_warehouse" });
    await queryInterface.addIndex("receipts", ["status"], { name: "idx_receipts_status" });
    await queryInterface.addIndex("receipts", ["responsible_user_id"], { name: "idx_receipts_responsible" });
    await queryInterface.addIndex("receipts", ["scheduled_date"], { name: "idx_receipts_scheduled_date" });
    await queryInterface.addIndex("receipts", ["contact_id"], { name: "idx_receipts_contact" });
  },
  async down(queryInterface) { await queryInterface.dropTable("receipts"); },
};
