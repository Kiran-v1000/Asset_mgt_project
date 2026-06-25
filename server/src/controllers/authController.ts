import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/responseHandler.js';
import { authService } from '../services/authService.js';
import type { AuthedRequest } from '../models/types.js';

export const authController = {
  login: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    ok(res, result, 'Signed in successfully');
  }),

  me: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await authService.me(req.auth!.userId));
  }),

  logout: asyncHandler(async (_req: AuthedRequest, res: Response) => {
    // Stateless JWT: client discards tokens. Endpoint exists for symmetry/audit.
    ok(res, null, 'Signed out');
  }),
};
