import { prisma } from '../config/db.js';
import { recordAudit } from './auditService.js';
import { AppError } from '../utils/AppError.js';
import type { PageArgs } from '../utils/pagination.js';
import type { AuthContext } from '../models/types.js';
import type { Prisma } from '@prisma/client';

const include = {
  asset: { select: { id: true, name: true, assetCode: true, status: true } },
  employee: { select: { id: true, name: true, employeeCode: true } },
} satisfies Prisma.ReservationInclude;

interface ReserveInput {
  assetId: string;
  employeeId?: string;
  reservedForDate?: Date | null;
  notes?: string;
}

export const reservationService = {
  async list(args: PageArgs, actor: AuthContext, status?: string) {
    const where: Prisma.ReservationWhereInput = {
      asset: { organizationId: actor.organizationId },
      ...(status ? { status: status as Prisma.EnumReservationStatusFilter['equals'] } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.reservation.findMany({ where, include, orderBy: { [args.sort]: args.order }, skip: args.skip, take: args.limit }),
      prisma.reservation.count({ where }),
    ]);
    return { rows, total };
  },

  async reserve(input: ReserveInput, actor: AuthContext) {
    const asset = await prisma.asset.findFirst({ where: { id: input.assetId, organizationId: actor.organizationId } });
    if (!asset) throw AppError.notFound('Asset');
    if (asset.status !== 'AVAILABLE') throw new AppError(`Asset is ${asset.status} and cannot be reserved`, 409);

    const [reservation] = await prisma.$transaction([
      prisma.reservation.create({
        data: {
          assetId: input.assetId,
          employeeId: input.employeeId ?? undefined,
          reservedForDate: input.reservedForDate ?? undefined,
          notes: input.notes,
          createdById: actor.userId,
        },
        include,
      }),
      prisma.asset.update({ where: { id: input.assetId }, data: { status: 'RESERVED' } }),
    ]);

    await recordAudit(actor, {
      action: 'RESERVE', module: 'Assets', entity: 'Asset', entityId: input.assetId,
      summary: `Asset ${asset.assetCode} reserved`,
    });
    return reservation;
  },

  async cancel(id: string, actor: AuthContext) {
    const reservation = await prisma.reservation.findFirst({
      where: { id, asset: { organizationId: actor.organizationId } },
      include: { asset: true },
    });
    if (!reservation) throw AppError.notFound('Reservation');
    if (reservation.status !== 'RESERVED') throw new AppError('Reservation is not active', 409);

    const [updated] = await prisma.$transaction([
      prisma.reservation.update({ where: { id }, data: { status: 'CANCELLED' }, include }),
      ...(reservation.asset.status === 'RESERVED'
        ? [prisma.asset.update({ where: { id: reservation.assetId }, data: { status: 'AVAILABLE' } })]
        : []),
    ]);

    await recordAudit(actor, {
      action: 'CANCEL', module: 'Assets', entity: 'Asset', entityId: reservation.assetId,
      summary: `Reservation for ${reservation.asset.assetCode} cancelled`,
    });
    return updated;
  },
};
