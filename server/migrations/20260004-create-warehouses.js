"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("warehouses", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false },
      code: { type: Sequelize.STRING(10), allowNull: false, unique: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable("warehouses"); },
};
