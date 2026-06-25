import type { NextFunction, Response } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import type { AuthedRequest } from '../models/types.js';

/** Verifies the Bearer token, loads the user + permissions, attaches req.auth. */
export const authenticate = async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authentication token is required');
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account is inactive or no longer exists');
    }

    req.auth = {
      userId: user.id,
      organizationId: user.organizationId,
      roleId: user.roleId,
      email: user.email,
      name: user.name,
      permissions: user.role.permissions.map((rp) => rp.permission.key),
    };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(AppError.unauthorized('Invalid or expired token'));
  }
};
