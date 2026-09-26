import app from './app';
import { config } from './config';
import { connectDb } from './config/database';
import { logger } from './utils/logger';
import { migrator, seeder } from './config/umzug';

async function runMigrations(): Promise<void> {
  logger.info('Running database migrations (via Umzug)...');
  try {
    const migrations = await migrator.up();
    logger.info(`Executed ${migrations.length} migrations`);
    
    logger.info('Running database seeders...');
    const seeds = await seeder.up();
    logger.info(`Executed ${seeds.length} seeders`);
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  }
}

async function bootstrap(): Promise<void> {
  try {
    await connectDb();
    await runMigrations();
    app.listen(config.port, () => {
      logger.info(`StockSense API running on port ${config.port} [${config.env}]`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

bootstrap();
