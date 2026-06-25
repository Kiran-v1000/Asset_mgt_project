import { z } from 'zod';

const AssetStatus = z.enum([
  'AVAILABLE', 'ASSIGNED', 'IN_MAINTENANCE', 'IN_TRANSIT',
  'RESERVED', 'RETIRED', 'DISPOSED', 'LOST', 'DAMAGED',
]);
const AssetCondition = z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']);
const DepreciationMethod = z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE', 'NONE']);

export const createAssetSchema = z.object({
  name: z.string().min(2),
  assetCode: z.string().min(2).optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  barcode: z.string().optional(),
  rfidTag: z.string().optional(),
  purchaseDate: z.coerce.date().optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  salvageValue: z.coerce.number().min(0).optional(),
  depreciationMethod: DepreciationMethod.optional(),
  usefulLifeYears: z.coerce.number().int().min(0).optional(),
  vendorId: z.string().optional().nullable(),
  warrantyExpiry: z.coerce.date().optional().nullable(),
  amcExpiry: z.coerce.date().optional().nullable(),
  status: AssetStatus.optional(),
  condition: AssetCondition.optional(),
  locationId: z.string().optional().nullable(),
  specifications: z.record(z.any()).optional(),
  imageUrl: z.string().url().optional().nullable(),
  notes: z.string().optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const listAssetsQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  status: AssetStatus.optional(),
  categoryId: z.string().optional(),
  locationId: z.string().optional(),
});
