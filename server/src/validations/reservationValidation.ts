import { z } from 'zod';

export const reserveSchema = z.object({
  assetId: z.string().min(1),
  employeeId: z.string().optional().nullable(),
  reservedForDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
});
