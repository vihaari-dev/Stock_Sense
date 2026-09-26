"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("otp_codes", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      code_hash: { type: Sequelize.STRING(255), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("otp_codes", ["user_id"], { name: "idx_otp_codes_user" });
    await queryInterface.addIndex("otp_codes", ["expires_at"], { name: "idx_otp_codes_expires" });
  },
  async down(queryInterface) { await queryInterface.dropTable("otp_codes"); },
};
