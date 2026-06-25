import { prisma } from '../config/db.js';
import type { PageArgs } from '../utils/pagination.js';
import type { Prisma } from '@prisma/client';

const include = {
  category: { select: { id: true, name: true, code: true, icon: true } },
  vendor: { select: { id: true, vendorName: true } },
  location: { select: { id: true, name: true, city: true } },
  assignedTo: { select: { id: true, name: true, employeeCode: true, avatarUrl: true } },
} satisfies Prisma.AssetInclude;

export interface AssetFilters {
  status?: string;
  categoryId?: string;
  locationId?: string;
}

const buildWhere = (orgId: string, search: string, f: AssetFilters): Prisma.AssetWhereInput => ({
  organizationId: orgId,
  ...(f.status ? { status: f.status as Prisma.EnumAssetStatusFilter['equals'] } : {}),
  ...(f.categoryId ? { categoryId: f.categoryId } : {}),
  ...(f.locationId ? { locationId: f.locationId } : {}),
  ...(search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { assetCode: { contains: search, mode: 'insensitive' } },
          { serialNumber: { contains: search, mode: 'insensitive' } },
          { manufacturer: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}),
});

export const assetRepository = {
  async list(args: PageArgs, orgId: string, filters: AssetFilters) {
    const where = buildWhere(orgId, args.search, filters);
    const [rows, total] = await Promise.all([
      prisma.asset.findMany({
        where, include,
        orderBy: { [args.sort]: args.order },
        skip: args.skip, take: args.limit,
      }),
      prisma.asset.count({ where }),
    ]);
    return { rows, total };
  },

  findById: (id: string, orgId: string) =>
    prisma.asset.findFirst({
      where: { id, organizationId: orgId },
      include: {
        ...include,
        assignments: {
          take: 10, orderBy: { assignedDate: 'desc' },
          include: { employee: { select: { id: true, name: true, employeeCode: true } } },
        },
        maintenance: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    }),

  create: (data: Prisma.AssetUncheckedCreateInput) => prisma.asset.create({ data, include }),
  update: (id: string, data: Prisma.AssetUpdateInput) => prisma.asset.update({ where: { id }, data, include }),
  remove: (id: string) => prisma.asset.delete({ where: { id } }),

  // --- analytics helpers used by the dashboard ---
  countByStatus: (orgId: string) =>
    prisma.asset.groupBy({ by: ['status'], where: { organizationId: orgId }, _count: { _all: true } }),
  countByCategory: (orgId: string) =>
    prisma.asset.groupBy({ by: ['categoryId'], where: { organizationId: orgId }, _count: { _all: true } }),
  totals: (orgId: string) =>
    prisma.asset.aggregate({
      where: { organizationId: orgId },
      _count: { _all: true },
      _sum: { purchaseCost: true, currentValue: true },
    }),
  expiringWarranties: (orgId: string, withinDays: number) =>
    prisma.asset.findMany({
      where: {
        organizationId: orgId,
        warrantyExpiry: { gte: new Date(), lte: new Date(Date.now() + withinDays * 86400000) },
      },
      select: { id: true, name: true, assetCode: true, warrantyExpiry: true },
      orderBy: { warrantyExpiry: 'asc' }, take: 8,
    }),
};
