import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarCheck, Plus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationApi, reservationActions, assetApi } from '../../api/resourceApi';
import { useAuthStore } from '../../store/authStore';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/Badge';
import { date } from '../../utils/format';
import type { Reservation, Asset } from '../../utils/types';

export default function ReservationsPage() {
  const qc = useQueryClient();
  const canReserve = useAuthStore((s) => s.hasPermission('asset:assign'));
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['reservations', page], queryFn: () => reservationApi.list({ page, limit: 10 }) });
  const { data: available } = useQuery({ queryKey: ['assets', 'available-resv'], queryFn: () => assetApi.list({ status: 'AVAILABLE', limit: 100 }) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['reservations'] }); qc.invalidateQueries({ queryKey: ['assets'] }); };

  const reserve = useMutation({
    mutationFn: (v: Record<string, unknown>) => reservationActions.reserve(v),
    onSuccess: () => { toast.success('Asset reserved'); setOpen(false); reset(); invalidate(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to reserve'),
  });
  const cancel = useMutation({
    mutationFn: (r: Reservation) => reservationActions.cancel(r.id),
    onSuccess: () => { toast.success('Reservation cancelled'); setCancelling(null); invalidate(); },
    onError: () => toast.error('Failed to cancel'),
  });

  const assetOptions = (available?.data ?? []).map((a: Asset) => ({ value: a.id, label: `${a.name} (${a.assetCode})` }));

  const columns: Column<Reservation>[] = [
    {
      key: 'asset', header: 'Asset',
      render: (r) => <div><p className="font-medium text-slate-100">{r.asset?.name}</p><p className="font-mono text-xs text-slate-500">{r.asset?.assetCode}</p></div>,
    },
    { key: 'employee', header: 'Reserved By', render: (r) => <span className="text-slate-300">{r.employee?.name ?? '—'}</span> },
    { key: 'reservedForDate', header: 'Reserved For', render: (r) => <span className="text-slate-400">{date(r.reservedForDate)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: '__a', header: '', align: 'right',
      render: (r) => r.status === 'RESERVED' && canReserve ? (
        <button onClick={(e) => { e.stopPropagation(); setCancelling(r); }} className="btn-ghost px-2.5 py-1.5 text-xs">
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </button>
      ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Reservations"
        subtitle="Reserve available assets ahead of time for projects, onboarding or events."
        icon={<CalendarCheck className="h-5 w-5" />}
        actions={canReserve && <Button icon={<Plus className="h-4 w-4" />} onClick={() => { reset(); setOpen(true); }}>New Reservation</Button>}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="card p-4 sm:p-5">
        <DataTable columns={columns} rows={data?.data ?? []} loading={isLoading} rowKey={(r) => r.id} emptyMessage="No reservations yet." />
        <Pagination meta={data?.meta} onPage={setPage} />
      </motion.div>

      <Modal
        open={open} onClose={() => setOpen(false)}
        title="Reserve an Asset" subtitle="Hold an available asset for a future date."
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={reserve.isPending} onClick={handleSubmit((v) => reserve.mutate(v))}>Reserve</Button>
        </>}
      >
        <form className="space-y-4">
          <Field label="Asset" error={errors.assetId?.message as string}>
            <Select options={assetOptions} placeholder={assetOptions.length ? 'Select available asset' : 'No available assets'} {...register('assetId', { required: 'Select an asset' })} />
          </Field>
          <Field label="Reserved for date" error={errors.reservedForDate?.message as string}>
            <Input type="date" {...register('reservedForDate', { required: 'Pick a date' })} />
          </Field>
          <Field label="Notes"><Textarea placeholder="Purpose of the reservation…" {...register('notes')} /></Field>
        </form>
      </Modal>

      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title="Cancel Reservation"
        footer={<>
          <Button variant="ghost" onClick={() => setCancelling(null)}>Keep</Button>
          <Button variant="danger" loading={cancel.isPending} onClick={() => cancelling && cancel.mutate(cancelling)}>Cancel reservation</Button>
        </>}>
        <p className="text-sm text-slate-400">Release <span className="font-medium text-slate-200">{cancelling?.asset?.name}</span> back to available inventory?</p>
      </Modal>
    </div>
  );
}
