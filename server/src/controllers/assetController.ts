import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/responseHandler.js';
import { parsePageArgs } from '../utils/pagination.js';
import { assetService } from '../services/assetService.js';
import type { AuthedRequest } from '../models/types.js';

export const assetController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const args = parsePageArgs(req.query, 'createdAt');
    const filters = {
      status: req.query.status as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      locationId: req.query.locationId as string | undefined,
    };
    const { rows, total } = await assetService.list(args, filters, req.auth!);
    paginated(res, rows, { page: args.page, limit: args.limit, total });
  }),

  get: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await assetService.get(req.params.id, req.auth!));
  }),

  create: asyncHandler(async (req: AuthedRequest, res: Response) => {
    created(res, await assetService.create(req.body, req.auth!), 'Asset registered');
  }),

  update: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await assetService.update(req.params.id, req.body, req.auth!), 'Asset updated');
  }),

  remove: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await assetService.remove(req.params.id, req.auth!), 'Asset deleted');
  }),
};
