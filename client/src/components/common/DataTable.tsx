import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { TableSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, loading, rowKey, onRowClick, emptyMessage }: DataTableProps<T>) {
  if (loading) return <TableSkeleton rows={7} />;
  if (!rows.length) return <EmptyState message={emptyMessage ?? 'No records match your filters.'} />;

  const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400', alignCls[c.align ?? 'left'])}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={rowKey(row)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'group border-b border-white/5 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-white/[0.03]',
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={clsx('px-4 py-3.5 text-sm text-slate-300', alignCls[c.align ?? 'left'], c.className)}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
