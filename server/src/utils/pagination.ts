import type { ListQuery } from '../models/types.js';

export interface PageArgs {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  order: 'asc' | 'desc';
  search: string;
}

export const parsePageArgs = (q: ListQuery, defaultSort = 'createdAt'): PageArgs => {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 12));
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: (q.sort as string) || defaultSort,
    order: q.order === 'asc' ? 'asc' : 'desc',
    search: (q.search as string)?.trim() || '',
  };
};
