import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Singleton Prisma client. In dev we attach it to globalThis so hot-reload
 * (tsx watch) does not exhaust the connection pool by re-instantiating.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['error'] : ['warn', 'error'],
  });

if (!env.isProd) globalForPrisma.prisma = prisma;
