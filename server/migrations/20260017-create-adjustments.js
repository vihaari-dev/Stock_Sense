"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("adjustments", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      reference: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      location_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "locations", key: "id" }, onDelete: "RESTRICT" },
      responsible_user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "RESTRICT" },
      status: { type: Sequelize.ENUM("draft","done","canceled"), allowNull: false, defaultValue: "draft" },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("adjustments", ["location_id"], { name: "idx_adjustments_location" });
    await queryInterface.addIndex("adjustments", ["status"], { name: "idx_adjustments_status" });
    await queryInterface.addIndex("adjustments", ["responsible_user_id"], { name: "idx_adjustments_responsible" });
  },
  async down(queryInterface) { await queryInterface.dropTable("adjustments"); },
};
