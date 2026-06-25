import type { Response } from 'express';

/** Standardised success envelope — keeps every endpoint response shape consistent. */
export const ok = <T>(res: Response, data: T, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const created = <T>(res: Response, data: T, message = 'Created') =>
  ok(res, data, message, 201);

export const paginated = <T>(
  res: Response,
  data: T[],
  meta: { page: number; limit: number; total: number },
) =>
  res.status(200).json({
    success: true,
    message: 'Success',
    data,
    meta: { ...meta, totalPages: Math.max(1, Math.ceil(meta.total / meta.limit)) },
  });
