import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Boxes, CheckCircle2, Wrench, TrendingUp, Wallet,
  Users, Store, ArrowUpRight, ShieldAlert, Activity,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { CardGridSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { TrendArea, StatusDonut, CategoryBar } from '../../components/charts/Charts';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { currency, number, relativeTime, date, daysUntil, titleCase } from '../../utils/format';

function Panel({ title, icon, children, className }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
      className={`card p-5 ${className ?? ''}`}
    >
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({ queryKey: ['dashboard', 'overview'], queryFn: dashboardApi.overview });
  const { data: trend } = useQuery({ queryKey: ['dashboard', 'trend'], queryFn: dashboardApi.trend });

  const k = overview?.kpis;

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        subtitle="Real-time overview of asset health, utilization and cost across the organization."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      {isLoading || !k ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} label="Total Assets" value={number(k.totalAssets)} icon={<Boxes className="h-5 w-5" />} accent="brand" trend={{ value: `${k.available} available`, up: true }} />
          <StatCard index={1} label="Portfolio Value" value={currency(k.totalValue, true)} icon={<Wallet className="h-5 w-5" />} accent="emerald" trend={{ value: `${currency(k.purchaseValue, true)} acquired` }} />
          <StatCard index={2} label="Utilization" value={`${k.utilizationRate}%`} icon={<TrendingUp className="h-5 w-5" />} accent="cyan" trend={{ value: `${k.assigned} assigned`, up: true }} />
          <StatCard index={3} label="Open Maintenance" value={number(k.openMaintenance)} icon={<Wrench className="h-5 w-5" />} accent="amber" trend={{ value: `${k.inMaintenance} in workshop` }} />
        </div>
      )}

      {/* Secondary KPI strip */}
      {k && (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Active Assignments', value: number(k.activeAssignments), icon: CheckCircle2, color: 'text-emerald-300' },
            { label: 'Employees', value: number(k.employees), icon: Users, color: 'text-brand-300' },
            { label: 'Vendors', value: number(k.vendors), icon: Store, color: 'text-violet-300' },
            { label: 'Available Now', value: number(k.available), icon: Boxes, color: 'text-cyan-300' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
              className="card flex items-center gap-3 p-4"
            >
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Asset Acquisition Trend (12 months)" icon={<TrendingUp className="h-4 w-4 text-brand-300" />} className="lg:col-span-2">
          {trend ? <TrendArea data={trend} /> : <Skeleton className="h-64 w-full" />}
        </Panel>
        <Panel title="Status Distribution" icon={<Activity className="h-4 w-4 text-brand-300" />}>
          {overview ? <StatusDonut data={overview.statusBreakdown} /> : <Skeleton className="h-64 w-full" />}
          {overview && (
            <div className="mt-3 flex flex-wrap gap-2">
              {overview.statusBreakdown.slice(0, 5).map((s) => (
                <StatusBadge key={s.status} status={s.status} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Assets by Category" icon={<Boxes className="h-4 w-4 text-brand-300" />}>
          {overview ? <CategoryBar data={overview.categoryBreakdown} /> : <Skeleton className="h-64 w-full" />}
        </Panel>

        <Panel title="Warranties Expiring Soon" icon={<ShieldAlert className="h-4 w-4 text-amber-300" />}>
          <div className="space-y-2">
            {overview?.expiringWarranties.length ? (
              overview.expiringWarranties.map((w) => {
                const days = daysUntil(w.warrantyExpiry) ?? 0;
                return (
                  <div key={w.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{w.name}</p>
                      <p className="font-mono text-xs text-slate-500">{w.assetCode}</p>
                    </div>
                    <span className={`chip ${days < 15 ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>
                      {days}d
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No warranties expiring in the next 60 days.</p>
            )}
          </div>
        </Panel>

        <Panel title="Recent Activity" icon={<Activity className="h-4 w-4 text-brand-300" />}>
          <div className="space-y-1">
            {overview?.recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.03]">
                <Avatar name={a.actorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{a.summary ?? titleCase(a.action)}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span className="chip bg-white/5 ring-1 ring-white/10 !px-1.5 !py-0">{a.module}</span>
                    <span>{relativeTime(a.createdAt)}</span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              </div>
            )) ?? <Skeleton className="h-40 w-full" />}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-600">As of {date(new Date())}</p>
        </Panel>
      </div>
    </div>
  );
}
