import type { NextFunction, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import type { AuthedRequest } from '../models/types.js';
import type { PermissionKey } from '../models/permissions.js';

/**
 * Guards a route by required permission(s). The principal must hold *all*
 * listed permissions. Use after `authenticate`.
 */
export const requirePermission =
  (...required: PermissionKey[]) =>
  (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(AppError.unauthorized());
    const held = new Set(req.auth.permissions);
    const missing = required.filter((p) => !held.has(p));
    if (missing.length > 0) {
      return next(AppError.forbidden(`Missing permission(s): ${missing.join(', ')}`));
    }
    next();
  };
