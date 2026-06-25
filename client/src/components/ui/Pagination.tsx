import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '../../utils/types';

export function Pagination({ meta, onPage }: { meta?: PageMeta; onPage: (page: number) => void }) {
  if (!meta || meta.total === 0) return null;
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-1 pt-4 sm:flex-row">
      <p className="text-xs text-slate-400">
        Showing <span className="font-medium text-slate-200">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-200">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-ghost px-2.5 py-1.5 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-3 text-sm text-slate-300">
          {page} / {totalPages}
        </span>
        <button
          className="btn-ghost px-2.5 py-1.5 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
