import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Plus, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignmentApi, assignmentActions, assetApi, employeeApi } from '../../api/resourceApi';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { date } from '../../utils/format';
import type { Assignment, Asset, Employee } from '../../utils/types';

export default function AssignmentsPage() {
  const qc = useQueryClient();
  const canAssign = useAuthStore((s) => s.hasPermission('asset:assign'));
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [returning, setReturning] = useState<Assignment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assignments', page, status],
    queryFn: () => assignmentApi.list({ page, limit: 10, status: status || undefined }),
  });
  const { data: availableAssets } = useQuery({ queryKey: ['assets', 'available'], queryFn: () => assetApi.list({ limit: 100, status: 'AVAILABLE' }) });
  const { data: employees } = useQuery({ queryKey: ['employees', 'all'], queryFn: () => employeeApi.list({ limit: 100 }) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['assignments'] }); qc.invalidateQueries({ queryKey: ['assets'] }); };

  const assign = useMutation({
    mutationFn: (v: Record<string, unknown>) => assignmentActions.assign(v),
    onSuccess: () => { toast.success('Asset assigned'); setAssignOpen(false); reset(); invalidate(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to assign'),
  });
  const doReturn = useMutation({
    mutationFn: (a: Assignment) => assignmentActions.returnAsset(a.id, {}),
    onSuccess: () => { toast.success('Asset returned to inventory'); setReturning(null); invalidate(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to return'),
  });

  const columns: Column<Assignment>[] = [
    {
      key: 'asset', header: 'Asset',
      render: (a) => (
        <div>
          <p className="font-medium text-slate-100">{a.asset?.name}</p>
          <p className="font-mono text-xs text-slate-500">{a.asset?.assetCode}</p>
        </div>
      ),
    },
    {
      key: 'employee', header: 'Assigned To',
      render: (a) => (
        <div className="flex items-center gap-2">
          <Avatar name={a.employee?.name} size="sm" />
          <span className="text-sm text-slate-200">{a.employee?.name}</span>
        </div>
      ),
    },
    { key: 'assignedDate', header: 'Assigned', render: (a) => <span className="text-slate-400">{date(a.assignedDate)}</span> },
    { key: 'expectedReturnDate', header: 'Due', render: (a) => <span className="text-slate-400">{date(a.expectedReturnDate)}</span> },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: '__a', header: '', align: 'right',
      render: (a) => a.status === 'ACTIVE' && canAssign ? (
        <button onClick={(e) => { e.stopPropagation(); setReturning(a); }} className="btn-ghost px-2.5 py-1.5 text-xs">
          <Undo2 className="h-3.5 w-3.5" /> Return
        </button>
      ) : null,
    },
  ];

  const assetOptions = (availableAssets?.data ?? []).map((a: Asset) => ({ value: a.id, label: `${a.name} (${a.assetCode})` }));
  const empOptions = (employees?.data ?? []).map((e: Employee) => ({ value: e.id, label: `${e.name} (${e.employeeCode})` }));

  return (
    <div>
      <PageHeader
        title="Asset Assignments"
        subtitle="Check assets out to employees and process returns to inventory."
        icon={<ArrowLeftRight className="h-5 w-5" />}
        actions={canAssign && <Button icon={<Plus className="h-4 w-4" />} onClick={() => { reset(); setAssignOpen(true); }}>Assign Asset</Button>}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="card p-4 sm:p-5">
        <div className="mb-4 flex gap-2">
          {['', 'ACTIVE', 'RETURNED', 'OVERDUE'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`chip ring-1 ring-white/10 transition ${status === s ? 'bg-gradient-brand-soft text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            >
              {s ? s.charAt(0) + s.slice(1).toLowerCase() : 'All'}
            </button>
          ))}
        </div>
        <DataTable columns={columns} rows={data?.data ?? []} loading={isLoading} rowKey={(a) => a.id} emptyMessage="No assignments yet." />
        <Pagination meta={data?.meta} onPage={setPage} />
      </motion.div>

      {/* Assign modal */}
      <Modal
        open={assignOpen} onClose={() => setAssignOpen(false)}
        title="Assign Asset" subtitle="Check out an available asset to an employee."
        footer={<>
          <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button loading={assign.isPending} onClick={handleSubmit((v) => assign.mutate(v))}>Assign</Button>
        </>}
      >
        <form onSubmit={handleSubmit((v) => assign.mutate(v))} className="space-y-4">
          <Field label="Asset" error={errors.assetId?.message as string}>
            <Select options={assetOptions} placeholder={assetOptions.length ? 'Select available asset' : 'No available assets'} {...register('assetId', { required: 'Select an asset' })} />
          </Field>
          <Field label="Employee" error={errors.employeeId?.message as string}>
            <Select options={empOptions} placeholder="Select employee" {...register('employeeId', { required: 'Select an employee' })} />
          </Field>
          <Field label="Expected return date">
            <Input type="date" {...register('expectedReturnDate')} />
          </Field>
        </form>
      </Modal>

      {/* Return confirm */}
      <Modal open={!!returning} onClose={() => setReturning(null)} title="Return Asset"
        footer={<>
          <Button variant="ghost" onClick={() => setReturning(null)}>Cancel</Button>
          <Button loading={doReturn.isPending} onClick={() => returning && doReturn.mutate(returning)}>Confirm return</Button>
        </>}>
        <p className="text-sm text-slate-400">
          Return <span className="font-medium text-slate-200">{returning?.asset?.name}</span> from{' '}
          <span className="font-medium text-slate-200">{returning?.employee?.name}</span> back to inventory? The asset will become available again.
        </p>
      </Modal>
    </div>
  );
}
