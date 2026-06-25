import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/responseHandler.js';
import { parsePageArgs } from '../utils/pagination.js';
import { assignmentService } from '../services/assignmentService.js';
import type { AuthedRequest } from '../models/types.js';

export const assignmentController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const args = parsePageArgs(req.query, 'assignedDate');
    const { rows, total } = await assignmentService.list(args, req.query.status as string, req.auth!);
    paginated(res, rows, { page: args.page, limit: args.limit, total });
  }),

  assign: asyncHandler(async (req: AuthedRequest, res: Response) => {
    created(res, await assignmentService.assign(req.body, req.auth!), 'Asset assigned');
  }),

  return: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await assignmentService.returnAsset(req.params.id, req.body, req.auth!), 'Asset returned');
  }),
};
