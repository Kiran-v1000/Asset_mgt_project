import type { PageArgs } from '../utils/pagination.js';

/** Minimal shape shared by all Prisma model delegates we use generically. */
export interface CrudDelegate {
  findMany(args: unknown): Promise<unknown[]>;
  findFirst(args: unknown): Promise<unknown | null>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
  count(args: unknown): Promise<number>;
}

export interface CrudConfig {
  /** Scope all queries to the caller's organization. */
  orgScoped?: boolean;
  /** Fields used for case-insensitive `search`. */
  searchFields?: string[];
  /** Relations to eager-load on list/detail. */
  include?: Record<string, unknown>;
}

/**
 * Builds a reusable data-access layer around a Prisma delegate. This is the ONLY
 * place that talks to the database for simple resources (separation of concerns).
 */
export const createCrudRepository = (delegate: CrudDelegate, config: CrudConfig = {}) => {
  const buildWhere = (orgId?: string, search?: string, extra?: Record<string, unknown>) => {
    const where: Record<string, unknown> = { ...(extra ?? {}) };
    if (config.orgScoped && orgId) where.organizationId = orgId;
    if (search && config.searchFields?.length) {
      where.OR = config.searchFields.map((f) => ({
        [f]: { contains: search, mode: 'insensitive' },
      }));
    }
    return where;
  };

  return {
    async list(args: PageArgs, orgId?: string, extraWhere?: Record<string, unknown>) {
      const where = buildWhere(orgId, args.search, extraWhere);
      const [rows, total] = await Promise.all([
        delegate.findMany({
          where,
          include: config.include,
          orderBy: { [args.sort]: args.order },
          skip: args.skip,
          take: args.limit,
        }),
        delegate.count({ where }),
      ]);
      return { rows, total };
    },

    async findById(id: string, orgId?: string) {
      return delegate.findFirst({
        where: buildWhere(orgId, undefined, { id }),
        include: config.include,
      });
    },

    async create(data: Record<string, unknown>, orgId?: string) {
      const payload = config.orgScoped && orgId ? { ...data, organizationId: orgId } : data;
      return delegate.create({ data: payload, include: config.include });
    },

    async update(id: string, data: Record<string, unknown>) {
      return delegate.update({ where: { id }, data, include: config.include });
    },

    async remove(id: string) {
      return delegate.delete({ where: { id } });
    },

    async count(orgId?: string, extraWhere?: Record<string, unknown>) {
      return delegate.count({ where: buildWhere(orgId, undefined, extraWhere) });
    },
  };
};

export type CrudRepository = ReturnType<typeof createCrudRepository>;
