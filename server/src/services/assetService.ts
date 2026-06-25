import { assetRepository, type AssetFilters } from '../repositories/assetRepository.js';
import { recordAudit } from './auditService.js';
import { AppError } from '../utils/AppError.js';
import { generateCode, generateQrToken } from '../utils/codes.js';
import type { PageArgs } from '../utils/pagination.js';
import type { AuthContext } from '../models/types.js';

export const assetService = {
  list: (args: PageArgs, filters: AssetFilters, actor: AuthContext) =>
    assetRepository.list(args, actor.organizationId, filters),

  async get(id: string, actor: AuthContext) {
    const asset = await assetRepository.findById(id, actor.organizationId);
    if (!asset) throw AppError.notFound('Asset');
    return asset;
  },

  async create(data: Record<string, unknown>, actor: AuthContext) {
    const payload = {
      ...data,
      organizationId: actor.organizationId,
      assetCode: (data.assetCode as string) || generateCode('AST'),
      qrCode: generateQrToken(),
      currentValue: (data.currentValue as number) ?? (data.purchaseCost as number) ?? 0,
    };
    const asset = await assetRepository.create(payload as never);
    await recordAudit(actor, {
      action: 'CREATE', module: 'Assets', entity: 'Asset', entityId: asset.id,
      summary: `Asset "${asset.name}" (${asset.assetCode}) registered`,
    });
    return asset;
  },

  async update(id: string, data: Record<string, unknown>, actor: AuthContext) {
    await this.get(id, actor);
    const asset = await assetRepository.update(id, data as never);
    await recordAudit(actor, {
      action: 'UPDATE', module: 'Assets', entity: 'Asset', entityId: id,
      summary: `Asset "${asset.name}" updated`, metadata: data,
    });
    return asset;
  },

  async remove(id: string, actor: AuthContext) {
    const asset = await this.get(id, actor);
    if (asset.status === 'ASSIGNED') {
      throw new AppError('Cannot delete an asset that is currently assigned. Return it first.', 409);
    }
    await assetRepository.remove(id);
    await recordAudit(actor, {
      action: 'DELETE', module: 'Assets', entity: 'Asset', entityId: id,
      summary: `Asset "${asset.name}" deleted`,
    });
    return { id };
  },
};
