"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transfers", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      reference: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      source_location_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "locations", key: "id" }, onDelete: "RESTRICT" },
      destination_location_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "locations", key: "id" }, onDelete: "RESTRICT" },
      responsible_user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      status: { type: Sequelize.ENUM("draft","ready","done","canceled"), allowNull: false, defaultValue: "draft" },
      scheduled_date: { type: Sequelize.DATEONLY, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("transfers", ["source_location_id"], { name: "idx_transfers_source" });
    await queryInterface.addIndex("transfers", ["destination_location_id"], { name: "idx_transfers_dest" });
    await queryInterface.addIndex("transfers", ["status"], { name: "idx_transfers_status" });
    await queryInterface.addIndex("transfers", ["responsible_user_id"], { name: "idx_transfers_responsible" });
    await queryInterface.addIndex("transfers", ["scheduled_date"], { name: "idx_transfers_scheduled_date" });
  },
  async down(queryInterface) { await queryInterface.dropTable("transfers"); },
};
