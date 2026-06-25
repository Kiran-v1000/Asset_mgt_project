import { AppError } from '../utils/AppError.js';
import { recordAudit } from './auditService.js';
import type { CrudRepository } from '../repositories/crudRepository.js';
import type { PageArgs } from '../utils/pagination.js';
import type { AuthContext } from '../models/types.js';

export interface CrudServiceConfig {
  resource: string; // human label, e.g. "Vendor"
  module: string; // audit module, e.g. "Procurement"
  orgScoped?: boolean;
  /** Optional hook to enrich the payload before create (e.g. generate a code). */
  prepareCreate?: (data: Record<string, unknown>, actor: AuthContext) => Record<string, unknown>;
}

/**
 * Business-logic layer for simple resources: enforces existence, org-scoping
 * and writes audit trails. Controllers never touch repositories directly.
 */
export const createCrudService = (repo: CrudRepository, cfg: CrudServiceConfig) => {
  const orgOf = (actor: AuthContext) => (cfg.orgScoped ? actor.organizationId : undefined);

  return {
    list: (args: PageArgs, actor: AuthContext, extraWhere?: Record<string, unknown>) =>
      repo.list(args, orgOf(actor), extraWhere),

    async get(id: string, actor: AuthContext) {
      const row = await repo.findById(id, orgOf(actor));
      if (!row) throw AppError.notFound(cfg.resource);
      return row;
    },

    async create(data: Record<string, unknown>, actor: AuthContext) {
      const payload = cfg.prepareCreate ? cfg.prepareCreate(data, actor) : data;
      const row = (await repo.create(payload, orgOf(actor))) as { id: string };
      await recordAudit(actor, {
        action: 'CREATE', module: cfg.module, entity: cfg.resource, entityId: row.id,
        summary: `${cfg.resource} created`, metadata: data,
      });
      return row;
    },

    async update(id: string, data: Record<string, unknown>, actor: AuthContext) {
      await this.get(id, actor); // ensures existence + org scope
      const row = await repo.update(id, data);
      await recordAudit(actor, {
        action: 'UPDATE', module: cfg.module, entity: cfg.resource, entityId: id,
        summary: `${cfg.resource} updated`, metadata: data,
      });
      return row;
    },

    async remove(id: string, actor: AuthContext) {
      await this.get(id, actor);
      await repo.remove(id);
      await recordAudit(actor, {
        action: 'DELETE', module: cfg.module, entity: cfg.resource, entityId: id,
        summary: `${cfg.resource} deleted`,
      });
      return { id };
    },
  };
};

export type CrudService = ReturnType<typeof createCrudService>;
