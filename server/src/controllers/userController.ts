import type { Response } from 'express';
import { prisma } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/responseHandler.js';
import { parsePageArgs } from '../utils/pagination.js';
import { hashPassword } from '../utils/encryption.js';
import { recordAudit } from '../services/auditService.js';
import { AppError } from '../utils/AppError.js';
import type { AuthedRequest } from '../models/types.js';
import type { Prisma } from '@prisma/client';

const safeSelect = {
  id: true, name: true, email: true, phone: true, avatarUrl: true, isActive: true,
  lastLoginAt: true, createdAt: true,
  role: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export const userController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const args = parsePageArgs(req.query, 'createdAt');
    const where: Prisma.UserWhereInput = {
      organizationId: req.auth!.organizationId,
      ...(args.search
        ? { OR: [
            { name: { contains: args.search, mode: 'insensitive' } },
            { email: { contains: args.search, mode: 'insensitive' } },
          ] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.user.findMany({ where, select: safeSelect, orderBy: { [args.sort]: args.order }, skip: args.skip, take: args.limit }),
      prisma.user.count({ where }),
    ]);
    paginated(res, rows, { page: args.page, limit: args.limit, total });
  }),

  create: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { name, email, password, roleId, departmentId, locationId, phone } = req.body;
    if (!password || password.length < 6) throw new AppError('Password must be at least 6 characters', 422);
    const user = await prisma.user.create({
      data: {
        organizationId: req.auth!.organizationId,
        name, email: String(email).toLowerCase(), passwordHash: await hashPassword(password),
        roleId, departmentId: departmentId || null, locationId: locationId || null, phone,
      },
      select: safeSelect,
    });
    await recordAudit(req.auth, { action: 'CREATE', module: 'Administration', entity: 'User', entityId: user.id, summary: `User ${user.email} created` });
    created(res, user, 'User created');
  }),

  update: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { name, roleId, departmentId, locationId, phone, isActive, password } = req.body;
    const data: Prisma.UserUpdateInput = { name, phone, isActive };
    if (roleId) data.role = { connect: { id: roleId } };
    if (departmentId !== undefined) data.department = departmentId ? { connect: { id: departmentId } } : { disconnect: true };
    if (locationId !== undefined) data.location = locationId ? { connect: { id: locationId } } : { disconnect: true };
    if (password) data.passwordHash = await hashPassword(password);
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: safeSelect });
    await recordAudit(req.auth, { action: 'UPDATE', module: 'Administration', entity: 'User', entityId: req.params.id, summary: `User ${user.email} updated` });
    ok(res, user, 'User updated');
  }),

  remove: asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.params.id === req.auth!.userId) throw new AppError('You cannot delete your own account', 409);
    await prisma.user.delete({ where: { id: req.params.id } });
    await recordAudit(req.auth, { action: 'DELETE', module: 'Administration', entity: 'User', entityId: req.params.id, summary: 'User deleted' });
    ok(res, { id: req.params.id }, 'User deleted');
  }),

  roles: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const roles = await prisma.role.findMany({
      where: { organizationId: req.auth!.organizationId },
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
    ok(res, roles.map((r) => ({
      id: r.id, name: r.name, description: r.description, isSystem: r.isSystem,
      userCount: r._count.users,
      permissions: r.permissions.map((p) => p.permission.key),
    })));
  }),
};
