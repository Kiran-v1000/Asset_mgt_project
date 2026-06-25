import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { logger } from './utils/logger.js';

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    const app = createApp();
    const server = app.listen(env.port, () => {
      logger.info(`EAMS API running on http://localhost:${env.port}${env.apiPrefix} (${env.nodeEnv})`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Failed to start server', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

void start();
