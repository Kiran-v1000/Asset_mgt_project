import { prisma } from '../config/db.js';
import { assignmentRepository } from '../repositories/assignmentRepository.js';
import { recordAudit } from './auditService.js';
import { AppError } from '../utils/AppError.js';
import type { PageArgs } from '../utils/pagination.js';
import type { AuthContext } from '../models/types.js';

interface AssignInput {
  assetId: string;
  employeeId: string;
  expectedReturnDate?: Date | null;
  conditionOnAssign?: string;
  notes?: string;
}

export const assignmentService = {
  list: (args: PageArgs, status: string | undefined, actor: AuthContext) =>
    assignmentRepository.list(args, actor.organizationId, status),

  async assign(input: AssignInput, actor: AuthContext) {
    const asset = await prisma.asset.findFirst({
      where: { id: input.assetId, organizationId: actor.organizationId },
    });
    if (!asset) throw AppError.notFound('Asset');
    if (asset.status !== 'AVAILABLE' && asset.status !== 'RESERVED') {
      throw new AppError(`Asset is ${asset.status} and cannot be assigned`, 409);
    }
    const employee = await prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId: actor.organizationId },
    });
    if (!employee) throw AppError.notFound('Employee');

    // Atomic: create the assignment and flip the asset to ASSIGNED together.
    const [assignment] = await prisma.$transaction([
      prisma.assetAssignment.create({
        data: {
          assetId: input.assetId,
          employeeId: input.employeeId,
          assignedById: actor.userId,
          expectedReturnDate: input.expectedReturnDate ?? undefined,
          conditionOnAssign: (input.conditionOnAssign as never) ?? asset.condition,
          notes: input.notes,
        },
      }),
      prisma.asset.update({
        where: { id: input.assetId },
        data: { status: 'ASSIGNED', assignedToId: input.employeeId },
      }),
    ]);

    await recordAudit(actor, {
      action: 'ASSIGN', module: 'Assets', entity: 'Asset', entityId: input.assetId,
      summary: `Asset ${asset.assetCode} assigned to ${employee.name}`,
    });
    return assignment;
  },

  async returnAsset(
    assignmentId: string,
    data: { conditionOnReturn?: string; notes?: string },
    actor: AuthContext,
  ) {
    const assignment = await prisma.assetAssignment.findFirst({
      where: { id: assignmentId, asset: { organizationId: actor.organizationId } },
      include: { asset: true },
    });
    if (!assignment) throw AppError.notFound('Assignment');
    if (assignment.status !== 'ACTIVE' && assignment.status !== 'OVERDUE') {
      throw new AppError('This assignment has already been closed', 409);
    }

    const [updated] = await prisma.$transaction([
      prisma.assetAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'RETURNED',
          actualReturnDate: new Date(),
          conditionOnReturn: (data.conditionOnReturn as never) ?? undefined,
          notes: data.notes ?? assignment.notes,
        },
      }),
      prisma.asset.update({
        where: { id: assignment.assetId },
        data: {
          status: 'AVAILABLE',
          assignedToId: null,
          ...(data.conditionOnReturn ? { condition: data.conditionOnReturn as never } : {}),
        },
      }),
    ]);

    await recordAudit(actor, {
      action: 'RETURN', module: 'Assets', entity: 'Asset', entityId: assignment.assetId,
      summary: `Asset ${assignment.asset.assetCode} returned`,
    });
    return updated;
  },
};
