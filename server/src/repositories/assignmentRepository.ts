import { prisma } from '../config/db.js';
import type { PageArgs } from '../utils/pagination.js';
import type { Prisma } from '@prisma/client';

const include = {
  asset: { select: { id: true, name: true, assetCode: true, status: true } },
  employee: { select: { id: true, name: true, employeeCode: true, avatarUrl: true } },
  assignedBy: { select: { id: true, name: true } },
} satisfies Prisma.AssetAssignmentInclude;

export const assignmentRepository = {
  async list(args: PageArgs, orgId: string, status?: string) {
    const where: Prisma.AssetAssignmentWhereInput = {
      asset: { organizationId: orgId },
      ...(status ? { status: status as Prisma.EnumAssignmentStatusFilter['equals'] } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.assetAssignment.findMany({
        where, include, orderBy: { [args.sort]: args.order }, skip: args.skip, take: args.limit,
      }),
      prisma.assetAssignment.count({ where }),
    ]);
    return { rows, total };
  },

  findActiveByAsset: (assetId: string) =>
    prisma.assetAssignment.findFirst({ where: { assetId, status: 'ACTIVE' } }),

  countActive: (orgId: string) =>
    prisma.assetAssignment.count({ where: { status: 'ACTIVE', asset: { organizationId: orgId } } }),
};
