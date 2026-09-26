"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("contacts", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      type: { type: Sequelize.ENUM("supplier", "customer", "other"), allowNull: false, defaultValue: "other" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("contacts", ["type"], { name: "idx_contacts_type" });
  },
  async down(queryInterface) { await queryInterface.dropTable("contacts"); },
};
