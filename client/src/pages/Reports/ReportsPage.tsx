import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingDown, Wallet, Boxes, CalendarClock } from 'lucide-react';
import { assetApi } from '../../api/resourceApi';
import { dashboardApi } from '../../api/dashboardApi';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/ui/Button';
import { TrendArea, CategoryBar } from '../../components/charts/Charts';
import { Skeleton } from '../../components/ui/Skeleton';
import { currency, number } from '../../utils/format';
import type { Asset } from '../../utils/types';

const AGE_BUCKETS = [
  { label: '0–1 yr', min: 0, max: 12 },
  { label: '1–2 yrs', min: 12, max: 24 },
  { label: '2–3 yrs', min: 24, max: 36 },
  { label: '3–5 yrs', min: 36, max: 60 },
  { label: '5+ yrs', min: 60, max: Infinity },
];

const monthsBetween = (d?: string) => (d ? (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30.4) : 0);

export default function ReportsPage() {
  const { data: assetsRes, isLoading } = useQuery({ queryKey: ['assets', 'report'], queryFn: () => assetApi.list({ limit: 100 }) });
  const { data: trend } = useQuery({ queryKey: ['dashboard', 'trend'], queryFn: dashboardApi.trend });

  const assets = useMemo(() => assetsRes?.data ?? [], [assetsRes]);

  const stats = useMemo(() => {
    const purchase = assets.reduce((s, a) => s + a.purchaseCost, 0);
    const current = assets.reduce((s, a) => s + a.currentValue, 0);
    const avgAge = assets.length ? assets.reduce((s, a) => s + monthsBetween(a.purchaseDate), 0) / assets.length / 12 : 0;
    return { purchase, current, depreciation: purchase - current, avgAge };
  }, [assets]);

  const aging = useMemo(
    () =>
      AGE_BUCKETS.map((b) => {
        const items = assets.filter((a) => { const m = monthsBetween(a.purchaseDate); return m >= b.min && m < b.max; });
        return { label: b.label, count: items.length, value: items.reduce((s, a) => s + a.currentValue, 0) };
      }),
    [assets],
  );

  const byCategoryValue = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assets) map.set(a.category?.name ?? '—', (map.get(a.category?.name ?? '—') ?? 0) + a.currentValue);
    return Array.from(map.entries()).map(([name, count]) => ({ name, count: Math.round(count) })).sort((x, y) => y.count - x.count).slice(0, 8);
  }, [assets]);

  const exportCsv = () => {
    const header = ['Asset Code', 'Name', 'Category', 'Status', 'Condition', 'Purchase Cost', 'Current Value', 'Depreciation'];
    const rows = assets.map((a: Asset) => [
      a.assetCode, a.name, a.category?.name ?? '', a.status, a.condition,
      a.purchaseCost, a.currentValue, (a.purchaseCost - a.currentValue).toFixed(0),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url; link.download = `asset-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Depreciation, valuation, asset aging and acquisition forecasting."
        icon={<BarChart3 className="h-5 w-5" />}
        actions={<Button variant="ghost" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export CSV</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Acquisition Value" value={currency(stats.purchase, true)} icon={<Wallet className="h-5 w-5" />} accent="brand" />
        <StatCard index={1} label="Current Book Value" value={currency(stats.current, true)} icon={<Boxes className="h-5 w-5" />} accent="emerald" />
        <StatCard index={2} label="Accumulated Depreciation" value={currency(stats.depreciation, true)} icon={<TrendingDown className="h-5 w-5" />} accent="amber" />
        <StatCard index={3} label="Avg. Asset Age" value={`${stats.avgAge.toFixed(1)} yrs`} icon={<CalendarClock className="h-5 w-5" />} accent="cyan" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-white">Acquisition & Spend Trend</h3>
          {trend ? <TrendArea data={trend} /> : <Skeleton className="h-64 w-full" />}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Book Value by Category</h3>
          {isLoading ? <Skeleton className="h-64 w-full" /> : <CategoryBar data={byCategoryValue} />}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Asset Aging Report</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {aging.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{b.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{number(b.count)}</p>
              <p className="mt-1 text-xs text-slate-400">{currency(b.value, true)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
