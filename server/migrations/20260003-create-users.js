"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      login_id: { type: Sequelize.STRING(12), allowNull: false, unique: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM("inventory_manager", "warehouse_staff"), allowNull: false },
      full_name: { type: Sequelize.STRING(150), allowNull: false },
      is_active: { type: Sequelize.TINYINT(1), allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
