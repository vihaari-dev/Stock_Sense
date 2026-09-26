"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("categories", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      parent_id: { type: Sequelize.BIGINT, allowNull: true, references: { model: "categories", key: "id" }, onDelete: "RESTRICT" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("categories", ["parent_id"], { name: "idx_categories_parent" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("categories");
  },
};
