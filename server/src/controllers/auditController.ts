import type { Response } from 'express';
import { prisma } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginated } from '../utils/responseHandler.js';
import { parsePageArgs } from '../utils/pagination.js';
import type { AuthedRequest, AuthContext } from '../models/types.js';
import type { Prisma } from '@prisma/client';

const buildWhere = (actor: AuthContext, search: string, module?: string): Prisma.AuditLogWhereInput => ({
  // Scope to the caller's organization via the related user.
  OR: search
    ? [
        { summary: { contains: search, mode: 'insensitive' } },
        { actorName: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
      ]
    : undefined,
  ...(module ? { module } : {}),
  user: { organizationId: actor.organizationId },
});

export const auditController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const args = parsePageArgs(req.query, 'createdAt');
    const where = buildWhere(req.auth!, args.search, req.query.module as string);
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, orderBy: { [args.sort]: args.order }, skip: args.skip, take: args.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    paginated(res, rows, { page: args.page, limit: args.limit, total });
  }),
};
