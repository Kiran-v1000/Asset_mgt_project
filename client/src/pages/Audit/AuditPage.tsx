import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, Plus, Pencil, Trash2, LogIn, ArrowLeftRight } from 'lucide-react';
import { auditApi } from '../../api/resourceApi';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Avatar } from '../../components/ui/Avatar';
import { Tag } from '../../components/ui/Badge';
import { useDebounce } from '../../hooks/useDebounce';
import { dateTime, relativeTime, titleCase } from '../../utils/format';
import type { AuditLog } from '../../utils/types';

const ACTION_ICON: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-4 w-4 text-emerald-300" />,
  UPDATE: <Pencil className="h-4 w-4 text-brand-300" />,
  DELETE: <Trash2 className="h-4 w-4 text-rose-300" />,
  LOGIN: <LogIn className="h-4 w-4 text-cyan-300" />,
  ASSIGN: <ArrowLeftRight className="h-4 w-4 text-violet-300" />,
  RETURN: <ArrowLeftRight className="h-4 w-4 text-amber-300" />,
};

const MODULES = ['', 'Assets', 'Procurement', 'Maintenance', 'Auth', 'Administration'];

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw);
  const [module, setModule] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, module],
    queryFn: () => auditApi.list({ page, limit: 12, search, module: module || undefined }),
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'action', header: 'Action',
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
            {ACTION_ICON[l.action] ?? <ShieldCheck className="h-4 w-4 text-slate-400" />}
          </div>
          <span className="font-medium text-slate-200">{titleCase(l.action)}</span>
        </div>
      ),
    },
    {
      key: 'actorName', header: 'Actor',
      render: (l) => (
        <div className="flex items-center gap-2">
          <Avatar name={l.actorName} size="sm" />
          <span className="text-sm text-slate-300">{l.actorName ?? 'System'}</span>
        </div>
      ),
    },
    { key: 'summary', header: 'Details', render: (l) => <span className="text-slate-300">{l.summary ?? '—'}</span> },
    { key: 'module', header: 'Module', render: (l) => <Tag>{l.module}</Tag> },
    { key: 'createdAt', header: 'When', align: 'right', render: (l) => <span title={dateTime(l.createdAt)} className="text-slate-400">{relativeTime(l.createdAt)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Audit & Compliance"
        subtitle="Immutable trail of every action performed across the platform."
        icon={<ShieldCheck className="h-5 w-5" />}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={searchRaw} onChange={(e) => { setSearchRaw(e.target.value); setPage(1); }} placeholder="Search actor, entity, summary…" className="input pl-10" />
          </div>
          <select className="input sm:w-48" value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }}>
            {MODULES.map((m) => <option key={m || 'all'} value={m}>{m || 'All modules'}</option>)}
          </select>
        </div>
        <DataTable columns={columns} rows={data?.data ?? []} loading={isLoading} rowKey={(l) => l.id} emptyMessage="No audit entries found." />
        <Pagination meta={data?.meta} onPage={setPage} />
      </motion.div>
    </div>
  );
}
