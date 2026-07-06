import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/responseHandler.js';
import { parsePageArgs } from '../utils/pagination.js';
import { reservationService } from '../services/reservationService.js';
import type { AuthedRequest } from '../models/types.js';

export const reservationController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const args = parsePageArgs(req.query, 'createdAt');
    const { rows, total } = await reservationService.list(args, req.auth!, req.query.status as string);
    paginated(res, rows, { page: args.page, limit: args.limit, total });
  }),

  reserve: asyncHandler(async (req: AuthedRequest, res: Response) => {
    created(res, await reservationService.reserve(req.body, req.auth!), 'Asset reserved');
  }),

  cancel: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await reservationService.cancel(req.params.id, req.auth!), 'Reservation cancelled');
  }),
};
