import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/responseHandler.js';
import { dashboardService } from '../services/dashboardService.js';
import type { AuthedRequest } from '../models/types.js';

export const dashboardController = {
  overview: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await dashboardService.overview(req.auth!));
  }),
  trend: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await dashboardService.trend(req.auth!));
  }),
};
