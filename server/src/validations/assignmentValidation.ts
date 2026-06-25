import { z } from 'zod';

const AssetCondition = z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']);

export const assignAssetSchema = z.object({
  assetId: z.string().min(1),
  employeeId: z.string().min(1),
  expectedReturnDate: z.coerce.date().optional().nullable(),
  conditionOnAssign: AssetCondition.optional(),
  notes: z.string().optional(),
});

export const returnAssetSchema = z.object({
  conditionOnReturn: AssetCondition.optional(),
  notes: z.string().optional(),
});
