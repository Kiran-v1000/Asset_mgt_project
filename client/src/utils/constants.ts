import type { AssetStatus, AssetCondition } from './types';

/** Tailwind classes for status chips — single source of truth for status colors. */
export const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  ASSIGNED: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30',
  IN_MAINTENANCE: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  IN_TRANSIT: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30',
  RESERVED: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  RETIRED: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30',
  DISPOSED: 'bg-slate-600/15 text-slate-400 ring-1 ring-slate-600/30',
  LOST: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  DAMAGED: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  // generic statuses (assignments / requests / maintenance)
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  RETURNED: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30',
  OVERDUE: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  PENDING: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  APPROVED: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  FULFILLED: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30',
  CANCELLED: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
  SCHEDULED: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
};

export const CONDITION_STYLES: Record<AssetCondition, string> = {
  NEW: 'text-emerald-300',
  EXCELLENT: 'text-emerald-300',
  GOOD: 'text-brand-300',
  FAIR: 'text-amber-300',
  POOR: 'text-rose-300',
};

export const ASSET_STATUSES: AssetStatus[] = [
  'AVAILABLE', 'ASSIGNED', 'IN_MAINTENANCE', 'IN_TRANSIT', 'RESERVED', 'RETIRED', 'DISPOSED', 'LOST', 'DAMAGED',
];

export const ASSET_CONDITIONS: AssetCondition[] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

/** Donut/segment palette for charts. */
export const CHART_COLORS = ['#6366f1', '#a855f7', '#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#818cf8', '#2dd4bf'];
