import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './database';
import path from 'path';
import { logger } from '../utils/logger';

// Custom logger adapter for Umzug so it pipes into our Winston logger
const umzugLogger = {
  info: (msg: Record<string, unknown>) => logger.info(String(msg.event || msg.message || 'umzug info'), msg),
  warn: (msg: Record<string, unknown>) => logger.warn(String(msg.event || msg.message || 'umzug warn'), msg),
  error: (msg: Record<string, unknown>) => logger.error(String(msg.event || msg.message || 'umzug error'), msg),
  debug: (msg: Record<string, unknown>) => logger.debug(String(msg.event || msg.message || 'umzug debug'), msg),
};

export const migrator = new Umzug({
  migrations: {
    glob: ['../../migrations/*.js', { cwd: __dirname }],
    resolve: ({ name, path: filePath, context }) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const migration = require(filePath as string);
      return {
        name,
        up: async () => migration.up(context, sequelize.Sequelize),
        down: async () => migration.down(context, sequelize.Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeMeta' }),
  logger: umzugLogger,
});

export const seeder = new Umzug({
  migrations: {
    glob: ['../../seeders/*.js', { cwd: __dirname }],
    resolve: ({ name, path: filePath, context }) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const seed = require(filePath as string);
      return {
        name,
        up: async () => seed.up(context, sequelize.Sequelize),
        down: async () => seed.down(context, sequelize.Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeData' }),
  logger: umzugLogger,
});
