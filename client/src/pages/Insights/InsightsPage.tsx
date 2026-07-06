import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, ShieldAlert, TrendingDown, ShoppingCart, Gauge, ArrowRight, Boxes } from 'lucide-react';
import { assetApi, maintenanceApi } from '../../api/resourceApi';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { CardGridSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { ValueProjection } from '../../components/charts/Charts';
import { buildWatchlist, buildProcurementRecs, projectDepreciation, SEVERITY_STYLES } from '../../utils/insights';
import { currency, number } from '../../utils/format';

export default function InsightsPage() {
  const { data: assetsRes, isLoading } = useQuery({ queryKey: ['assets', 'insights'], queryFn: () => assetApi.list({ limit: 100 }) });
  const { data: maintRes } = useQuery({ queryKey: ['maintenance', 'insights'], queryFn: () => maintenanceApi.list({ limit: 100 }) });

  const assets = useMemo(() => assetsRes?.data ?? [], [assetsRes]);
  const maintenance = useMemo(() => maintRes?.data ?? [], [maintRes]);

  const watchlist = useMemo(() => buildWatchlist(assets, maintenance), [assets, maintenance]);
  const recs = useMemo(() => buildProcurementRecs(assets, watchlist), [assets, watchlist]);
  const projection = useMemo(() => projectDepreciation(assets, 24), [assets]);

  const critical = watchlist.filter((r) => r.severity === 'Critical').length;
  const atRisk = watchlist.filter((r) => r.severity === 'Critical' || r.severity === 'High').length;
  const recSpend = recs.reduce((s, r) => s + r.estimatedSpend, 0);
  const yearDrop = projection.length > 12 ? projection[0].value - projection[12].value : 0;
  const topRisks = watchlist.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="AI Smart Insights"
        subtitle="Predictive asset-failure risk, procurement recommendations and value forecasting."
        icon={<Sparkles className="h-5 w-5" />}
        actions={
          <span className="chip bg-gradient-brand-soft text-brand-200 ring-1 ring-brand-500/30">
            <Sparkles className="h-3.5 w-3.5" /> Predictive engine
          </span>
        }
      />

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} label="At-Risk Assets" value={number(atRisk)} icon={<ShieldAlert className="h-5 w-5" />} accent="amber" trend={{ value: `${critical} critical` }} />
          <StatCard index={1} label="Critical Alerts" value={number(critical)} icon={<Gauge className="h-5 w-5" />} accent="brand" trend={{ value: 'need action now' }} />
          <StatCard index={2} label="Recommended Spend" value={currency(recSpend, true)} icon={<ShoppingCart className="h-5 w-5" />} accent="emerald" trend={{ value: `${recs.length} categories` }} />
          <StatCard index={3} label="12-mo Value Decline" value={currency(yearDrop, true)} icon={<TrendingDown className="h-5 w-5" />} accent="cyan" trend={{ value: 'projected depreciation' }} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Risk watchlist */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            <h3 className="text-sm font-semibold text-white">Predicted Failure-Risk Watchlist</h3>
          </div>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="space-y-2">
              {topRisks.map((r, i) => (
                <motion.div
                  key={r.asset.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 rounded-xl bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-brand-soft text-brand-300 ring-1 ring-white/10">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-100">{r.asset.name}</p>
                      <span className={`chip ${SEVERITY_STYLES[r.severity]}`}>{r.severity}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{r.reasons.join(' · ')}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${r.score}%` }} transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                          className={`h-full rounded-full ${r.score >= 70 ? 'bg-rose-400' : r.score >= 45 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold text-slate-300">{r.score}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Procurement recommendations */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-300" />
            <h3 className="text-sm font-semibold text-white">AI Procurement Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recs.length ? recs.slice(0, 5).map((r, i) => (
              <motion.div
                key={r.category}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-100">{r.category}</p>
                  <span className={`chip ${SEVERITY_STYLES[r.urgency]}`}>{r.urgency}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{r.rationale}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
                    <ShoppingCart className="h-3.5 w-3.5" /> Buy {r.replaceQty}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{currency(r.estimatedSpend, true)}</span>
                </div>
              </motion.div>
            )) : <p className="py-10 text-center text-sm text-slate-500">Portfolio is healthy — no procurement needed.</p>}
          </div>
        </motion.div>
      </div>

      {/* Depreciation projection */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-semibold text-white">Portfolio Book-Value Projection (24 months)</h3>
          </div>
          <span className="hidden items-center gap-1 text-xs text-slate-500 sm:inline-flex">
            Straight-line model <ArrowRight className="h-3 w-3" /> floored at salvage
          </span>
        </div>
        {isLoading ? <Skeleton className="h-64 w-full" /> : <ValueProjection data={projection} />}
      </motion.div>
    </div>
  );
}
