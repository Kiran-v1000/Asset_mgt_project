import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';
import type { AuthContext } from '../models/types.js';

interface AuditInput {
  action: string;
  module: string;
  entity: string;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Writes an immutable audit log entry. Failures are swallowed (logged only)
 * so auditing never breaks the primary operation.
 */
export const recordAudit = async (actor: AuthContext | undefined, input: AuditInput) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: actor?.userId,
        actorName: actor?.name ?? 'System',
        action: input.action,
        module: input.module,
        entity: input.entity,
        entityId: input.entityId,
        summary: input.summary,
        metadata: (input.metadata as object) ?? undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (err) {
    logger.warn('Failed to write audit log', err);
  }
};
