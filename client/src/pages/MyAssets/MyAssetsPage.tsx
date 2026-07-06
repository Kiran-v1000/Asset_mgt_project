import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LayoutGrid, Boxes, Wallet, FilePlus2, AlertTriangle, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignmentApi, requestApi, maintenanceApi } from '../../api/resourceApi';
import { useAuthStore } from '../../store/authStore';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/Badge';
import { CardGridSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { date, daysUntil } from '../../utils/format';
import type { Assignment } from '../../utils/types';

export default function MyAssetsPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [requestOpen, setRequestOpen] = useState(false);
  const [damageFor, setDamageFor] = useState<Assignment | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['assignments', 'mine'], queryFn: () => assignmentApi.list({ status: 'ACTIVE', limit: 100 }) });
  const mine = useMemo(
    () => (data?.data ?? []).filter((a) => a.employee?.id === user?.employeeId),
    [data, user?.employeeId],
  );

  const requestForm = useForm();
  const damageForm = useForm();

  const raiseRequest = useMutation({
    mutationFn: (v: Record<string, unknown>) => requestApi.create({ ...v, employeeId: user?.employeeId }),
    onSuccess: () => { toast.success('Request submitted'); setRequestOpen(false); requestForm.reset(); qc.invalidateQueries({ queryKey: ['requests'] }); },
    onError: () => toast.error('Failed to submit request'),
  });

  const reportDamage = useMutation({
    mutationFn: (v: Record<string, unknown>) =>
      maintenanceApi.create({ assetId: damageFor?.asset?.id, type: 'CORRECTIVE', status: 'SCHEDULED', title: `Damage report: ${damageFor?.asset?.name}`, description: v.description }),
    onSuccess: () => { toast.success('Damage reported — maintenance ticket raised'); setDamageFor(null); damageForm.reset(); qc.invalidateQueries({ queryKey: ['maintenance'] }); },
    onError: () => toast.error('Failed to report damage'),
  });

  const dueSoon = mine.filter((a) => { const d = daysUntil(a.expectedReturnDate); return d !== null && d >= 0 && d <= 30; }).length;

  return (
    <div>
      <PageHeader
        title="My Workspace"
        subtitle={`Assets assigned to you, ${user?.employeeName ?? user?.name}. Raise requests or report issues.`}
        icon={<LayoutGrid className="h-5 w-5" />}
        actions={<Button icon={<FilePlus2 className="h-4 w-4" />} onClick={() => { requestForm.reset(); setRequestOpen(true); }}>Request an Asset</Button>}
      />

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard index={0} label="Assigned to Me" value={mine.length} icon={<Boxes className="h-5 w-5" />} accent="brand" />
          <StatCard index={1} label="Active Since" value={mine.length ? date(mine[mine.length - 1].assignedDate) : '—'} icon={<CalendarClock className="h-5 w-5" />} accent="cyan" />
          <StatCard index={2} label="Returns Due (30d)" value={dueSoon} icon={<Wallet className="h-5 w-5" />} accent="emerald" />
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-white">My Assigned Assets</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : mine.length === 0 ? (
          <EmptyState title="No assets assigned" message="You don't currently hold any company assets. Raise a request to get equipped." action={<Button icon={<FilePlus2 className="h-4 w-4" />} onClick={() => setRequestOpen(true)}>Request an Asset</Button>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card card-hover flex flex-col p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand-soft text-brand-300 ring-1 ring-white/10">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <StatusBadge status={a.asset?.status ?? 'ASSIGNED'} />
                </div>
                <p className="mt-3 font-semibold text-slate-100">{a.asset?.name}</p>
                <p className="font-mono text-xs text-slate-500">{a.asset?.assetCode}</p>
                <div className="mt-2 text-xs text-slate-400">
                  Assigned {date(a.assignedDate)} · Due {date(a.expectedReturnDate)}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { damageForm.reset(); setDamageFor(a); }} className="btn-ghost flex-1 px-2.5 py-1.5 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5" /> Report damage
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Request modal */}
      <Modal
        open={requestOpen} onClose={() => setRequestOpen(false)}
        title="Request an Asset" subtitle="Submit a self-service request to the asset team."
        footer={<>
          <Button variant="ghost" onClick={() => setRequestOpen(false)}>Cancel</Button>
          <Button loading={raiseRequest.isPending} onClick={requestForm.handleSubmit((v) => raiseRequest.mutate(v))}>Submit request</Button>
        </>}
      >
        <form className="space-y-4">
          <Field label="Request type">
            <Select options={[
              { value: 'NEW_ASSET', label: 'New asset' }, { value: 'REPLACEMENT', label: 'Replacement' }, { value: 'REPAIR', label: 'Repair' },
            ]} {...requestForm.register('type')} />
          </Field>
          <Field label="Category"><Input placeholder="e.g. Laptops" {...requestForm.register('categoryName')} /></Field>
          <Field label="Justification"><Textarea placeholder="Why do you need this asset?" {...requestForm.register('justification')} /></Field>
        </form>
      </Modal>

      {/* Damage report modal */}
      <Modal
        open={!!damageFor} onClose={() => setDamageFor(null)}
        title="Report Damage" subtitle={damageFor?.asset?.name}
        footer={<>
          <Button variant="ghost" onClick={() => setDamageFor(null)}>Cancel</Button>
          <Button variant="danger" loading={reportDamage.isPending} onClick={damageForm.handleSubmit((v) => reportDamage.mutate(v))}>Report & raise ticket</Button>
        </>}
      >
        <form className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 p-3 text-amber-200 ring-1 ring-amber-500/20">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-xs">This raises a corrective maintenance ticket for the asset team to action.</p>
          </div>
          <Field label="Describe the issue"><Textarea placeholder="What happened to the asset?" {...damageForm.register('description', { required: true })} /></Field>
        </form>
      </Modal>
    </div>
  );
}
