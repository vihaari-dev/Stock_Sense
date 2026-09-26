import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import { config } from './index';
import { logger } from '../utils/logger';

export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  logging: (msg) => logger.debug(msg),
  define: {
    underscored: false,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  dialectOptions: {
    charset: 'utf8mb4',
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});


export async function connectDb(): Promise<void> {
  // 1. Create DB if it doesn't exist
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.pass,
  });
  
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.end();
  logger.info(`Verified database '${config.db.name}' exists.`);

  // 2. Connect Sequelize
  await sequelize.authenticate();
  logger.info('MySQL connection established');
}
