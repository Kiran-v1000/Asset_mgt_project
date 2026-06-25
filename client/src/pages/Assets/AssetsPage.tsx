import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Boxes, Plus, Search, QrCode, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { assetApi, categoryApi, vendorApi, locationApi } from '../../api/resourceApi';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuthStore } from '../../store/authStore';
import { ASSET_STATUSES, ASSET_CONDITIONS, CONDITION_STYLES } from '../../utils/constants';
import { currency, date, titleCase } from '../../utils/format';
import type { Asset, Category, Vendor, Location } from '../../utils/types';

export default function AssetsPage() {
  const qc = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('asset:create');
  const canEdit = hasPermission('asset:update');
  const canDelete = hasPermission('asset:delete');

  const [page, setPage] = useState(1);
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw);
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [detail, setDetail] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState<Asset | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['assets', page, search, status, categoryId],
    queryFn: () => assetApi.list({ page, limit: 10, search, status: status || undefined, categoryId: categoryId || undefined }),
  });
  const { data: categories } = useQuery({ queryKey: ['categories', 'all'], queryFn: () => categoryApi.list({ limit: 100 }) });
  const { data: vendors } = useQuery({ queryKey: ['vendors', 'all'], queryFn: () => vendorApi.list({ limit: 100 }) });
  const { data: locations } = useQuery({ queryKey: ['locations', 'all'], queryFn: () => locationApi.list({ limit: 100 }) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['assets'] });

  const save = useMutation({
    mutationFn: (v: Record<string, unknown>) => (editing ? assetApi.update(editing.id, v) : assetApi.create(v)),
    onSuccess: () => { toast.success(`Asset ${editing ? 'updated' : 'registered'}`); setFormOpen(false); setEditing(null); invalidate(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed to save asset'),
  });
  const del = useMutation({
    mutationFn: (a: Asset) => assetApi.remove(a.id),
    onSuccess: () => { toast.success('Asset deleted'); setDeleting(null); invalidate(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Cannot delete asset'),
  });

  const openCreate = () => { setEditing(null); reset({ name: '', categoryId: '', purchaseCost: '', status: 'AVAILABLE', condition: 'NEW' }); setFormOpen(true); };
  const openEdit = (a: Asset) => {
    setEditing(a);
    reset({
      name: a.name, categoryId: a.categoryId, serialNumber: a.serialNumber ?? '', manufacturer: a.manufacturer ?? '',
      model: a.model ?? '', purchaseCost: a.purchaseCost, vendorId: a.vendor?.id ?? '', locationId: a.location?.id ?? '',
      status: a.status, condition: a.condition, notes: a.description ?? '',
    });
    setFormOpen(true);
  };
  const onSubmit = (v: Record<string, unknown>) => {
    const cleaned = Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val === '' ? undefined : val]));
    save.mutate(cleaned);
  };

  const catOptions = (categories?.data ?? []).map((c: Category) => ({ value: c.id, label: c.name }));
  const vendorOptions = (vendors?.data ?? []).map((v: Vendor) => ({ value: v.id, label: v.vendorName }));
  const locOptions = (locations?.data ?? []).map((l: Location) => ({ value: l.id, label: l.name }));

  const columns: Column<Asset>[] = [
    {
      key: 'name', header: 'Asset',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand-soft text-brand-300 ring-1 ring-white/10">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-100">{a.name}</p>
            <p className="font-mono text-xs text-slate-500">{a.assetCode}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (a) => <span className="text-slate-300">{a.category?.name ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'condition', header: 'Condition', render: (a) => <span className={CONDITION_STYLES[a.condition]}>{titleCase(a.condition)}</span> },
    {
      key: 'assignedTo', header: 'Assigned To',
      render: (a) => a.assignedTo ? (
        <div className="flex items-center gap-2">
          <Avatar name={a.assignedTo.name} size="sm" />
          <span className="text-sm text-slate-300">{a.assignedTo.name}</span>
        </div>
      ) : <span className="text-slate-600">—</span>,
    },
    { key: 'currentValue', header: 'Value', align: 'right', render: (a) => <span className="font-medium text-slate-200">{currency(a.currentValue)}</span> },
  ];

  if (canEdit || canDelete) {
    columns.push({
      key: '__a', header: '', align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canEdit && <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-brand-300"><Pencil className="h-4 w-4" /></button>}
          {canDelete && <button onClick={(e) => { e.stopPropagation(); setDeleting(a); }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>}
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Asset Registry"
        subtitle="Register, track and manage every IT and non-IT asset across its lifecycle."
        icon={<Boxes className="h-5 w-5" />}
        actions={canCreate && <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Register Asset</Button>}
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={searchRaw} onChange={(e) => { setSearchRaw(e.target.value); setPage(1); }} placeholder="Search by name, code, serial…" className="input pl-10" />
          </div>
          <select className="input sm:w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {ASSET_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <select className="input sm:w-44" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {catOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <DataTable columns={columns} rows={data?.data ?? []} loading={isLoading} rowKey={(a) => a.id} onRowClick={setDetail} emptyMessage="No assets match your filters." />
        <Pagination meta={data?.meta} onPage={setPage} />
        {isFetching && !isLoading && <p className="pt-2 text-right text-xs text-slate-500">Updating…</p>}
      </motion.div>

      {/* Create / edit */}
      <Modal
        open={formOpen} onClose={() => setFormOpen(false)} size="lg"
        title={editing ? 'Edit Asset' : 'Register New Asset'}
        subtitle={editing ? 'Update asset details.' : 'Add a new asset to the registry. A code & QR token are generated automatically.'}
        footer={<>
          <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button loading={save.isPending} onClick={handleSubmit(onSubmit)}>{editing ? 'Save changes' : 'Register asset'}</Button>
        </>}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Asset name" error={errors.name?.message as string} className="sm:col-span-2">
            <Input placeholder="e.g. MacBook Pro 14" {...register('name', { required: 'Name is required' })} />
          </Field>
          <Field label="Category" error={errors.categoryId?.message as string}>
            <Select options={catOptions} placeholder="Select category" {...register('categoryId', { required: 'Category is required' })} />
          </Field>
          <Field label="Vendor"><Select options={vendorOptions} placeholder="Select vendor" {...register('vendorId')} /></Field>
          <Field label="Serial number"><Input placeholder="SN…" {...register('serialNumber')} /></Field>
          <Field label="Manufacturer"><Input placeholder="e.g. Apple" {...register('manufacturer')} /></Field>
          <Field label="Model"><Input placeholder="e.g. M3 Pro" {...register('model')} /></Field>
          <Field label="Purchase cost (₹)"><Input type="number" step="0.01" placeholder="0" {...register('purchaseCost', { valueAsNumber: true })} /></Field>
          <Field label="Location"><Select options={locOptions} placeholder="Select location" {...register('locationId')} /></Field>
          <Field label="Status"><Select options={ASSET_STATUSES.map((s) => ({ value: s, label: titleCase(s) }))} {...register('status')} /></Field>
          <Field label="Condition" className="sm:col-span-2"><Select options={ASSET_CONDITIONS.map((c) => ({ value: c, label: titleCase(c) }))} {...register('condition')} /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea placeholder="Optional notes…" {...register('notes')} /></Field>
        </form>
      </Modal>

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} size="lg" title={detail?.name} subtitle={detail?.assetCode}>
        {detail && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={detail.status} />
                <span className={`chip bg-white/5 ring-1 ring-white/10 ${CONDITION_STYLES[detail.condition]}`}>{titleCase(detail.condition)}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  ['Category', detail.category?.name], ['Manufacturer', detail.manufacturer], ['Model', detail.model],
                  ['Serial', detail.serialNumber], ['Vendor', detail.vendor?.vendorName], ['Location', detail.location?.name],
                  ['Purchase cost', currency(detail.purchaseCost)], ['Current value', currency(detail.currentValue)],
                  ['Purchased', date(detail.purchaseDate)], ['Warranty expiry', date(detail.warrantyExpiry)],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="mt-0.5 text-slate-200">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
              {detail.assignedTo && (
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                  <Avatar name={detail.assignedTo.name} />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{detail.assignedTo.name}</p>
                    <p className="text-xs text-slate-500">Currently assigned · {detail.assignedTo.employeeCode}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center justify-start gap-3 rounded-2xl bg-white/[0.03] p-5">
              <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-3">
                <QrCode className="h-full w-full text-ink-950" strokeWidth={1.1} />
              </div>
              <p className="text-center text-xs text-slate-400">Scan to verify</p>
              <p className="break-all text-center font-mono text-[10px] text-slate-600">{detail.qrCode}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Asset"
        footer={<>
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={del.isPending} onClick={() => deleting && del.mutate(deleting)}>Delete</Button>
        </>}>
        <p className="text-sm text-slate-400">Permanently remove <span className="font-medium text-slate-200">{deleting?.name}</span> from the registry? This cannot be undone.</p>
      </Modal>
    </div>
  );
}
