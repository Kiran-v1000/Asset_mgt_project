import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/responseHandler.js';
import { parsePageArgs } from '../utils/pagination.js';
import type { CrudService } from '../services/crudService.js';
import type { AuthedRequest } from '../models/types.js';

/** Maps a CRUD service onto Express handlers with a consistent response shape. */
export const createCrudController = (service: CrudService, defaultSort = 'createdAt') => ({
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const args = parsePageArgs(req.query, defaultSort);
    const { rows, total } = await service.list(args, req.auth!);
    paginated(res, rows, { page: args.page, limit: args.limit, total });
  }),

  get: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await service.get(req.params.id, req.auth!));
  }),

  create: asyncHandler(async (req: AuthedRequest, res: Response) => {
    created(res, await service.create(req.body, req.auth!));
  }),

  update: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await service.update(req.params.id, req.body, req.auth!), 'Updated');
  }),

  remove: asyncHandler(async (req: AuthedRequest, res: Response) => {
    ok(res, await service.remove(req.params.id, req.auth!), 'Deleted');
  }),
});
