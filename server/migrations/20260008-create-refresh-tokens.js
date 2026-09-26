"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("refresh_tokens", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      token_hash: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("refresh_tokens", ["user_id"], { name: "idx_refresh_tokens_user" });
    await queryInterface.addIndex("refresh_tokens", ["expires_at"], { name: "idx_refresh_tokens_expires" });
  },
  async down(queryInterface) { await queryInterface.dropTable("refresh_tokens"); },
};
