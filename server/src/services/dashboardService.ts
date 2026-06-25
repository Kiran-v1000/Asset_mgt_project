import { prisma } from '../config/db.js';
import { assetRepository } from '../repositories/assetRepository.js';
import { assignmentRepository } from '../repositories/assignmentRepository.js';
import type { AuthContext } from '../models/types.js';

export const dashboardService = {
  async overview(actor: AuthContext) {
    const orgId = actor.organizationId;

    const [totals, byStatus, byCategoryRaw, activeAssignments, maintenanceOpen, expiring, employees, vendors, recentAudit, categories] =
      await Promise.all([
        assetRepository.totals(orgId),
        assetRepository.countByStatus(orgId),
        assetRepository.countByCategory(orgId),
        assignmentRepository.countActive(orgId),
        prisma.maintenanceRecord.count({
          where: { asset: { organizationId: orgId }, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
        }),
        assetRepository.expiringWarranties(orgId, 60),
        prisma.employee.count({ where: { organizationId: orgId, isActive: true } }),
        prisma.vendor.count({ where: { organizationId: orgId, isActive: true } }),
        prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
        prisma.category.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } }),
      ]);

    const catName = new Map(categories.map((c) => [c.id, c.name]));
    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));

    const totalAssets = totals._count._all;
    const assigned = statusMap['ASSIGNED'] ?? 0;
    const available = statusMap['AVAILABLE'] ?? 0;
    const utilization = totalAssets ? Math.round((assigned / totalAssets) * 100) : 0;

    return {
      kpis: {
        totalAssets,
        totalValue: totals._sum.currentValue ?? 0,
        purchaseValue: totals._sum.purchaseCost ?? 0,
        assigned,
        available,
        inMaintenance: statusMap['IN_MAINTENANCE'] ?? 0,
        utilizationRate: utilization,
        activeAssignments,
        openMaintenance: maintenanceOpen,
        employees,
        vendors,
      },
      statusBreakdown: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      categoryBreakdown: byCategoryRaw
        .map((c) => ({ name: catName.get(c.categoryId) ?? 'Uncategorized', count: c._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      expiringWarranties: expiring,
      recentActivity: recentAudit,
    };
  },

  /** 12-month acquisition + spend trend (computed in app to stay DB-agnostic). */
  async trend(actor: AuthContext) {
    const assets = await prisma.asset.findMany({
      where: { organizationId: actor.organizationId, purchaseDate: { not: null } },
      select: { purchaseDate: true, purchaseCost: true },
    });
    const buckets = new Map<string, { count: number; spend: number }>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, { count: 0, spend: 0 });
    }
    for (const a of assets) {
      if (!a.purchaseDate) continue;
      const key = `${a.purchaseDate.getFullYear()}-${String(a.purchaseDate.getMonth() + 1).padStart(2, '0')}`;
      const b = buckets.get(key);
      if (b) { b.count += 1; b.spend += a.purchaseCost; }
    }
    return Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));
  },
};
