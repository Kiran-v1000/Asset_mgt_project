import { useQuery } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import { ResourceManager, type FormFieldDef } from '../../components/common/ResourceManager';
import { maintenanceApi, assetApi, vendorApi } from '../../api/resourceApi';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '../../components/ui/Badge';
import { currency, date, titleCase } from '../../utils/format';
import type { Column } from '../../components/common/DataTable';
import type { MaintenanceRecord, Asset, Vendor } from '../../utils/types';

const TYPES = ['PREVENTIVE', 'CORRECTIVE', 'AMC', 'WARRANTY_CLAIM', 'INSPECTION'];
const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const columns: Column<MaintenanceRecord>[] = [
  {
    key: 'title', header: 'Activity',
    render: (m) => (
      <div>
        <p className="font-medium text-slate-100">{m.title}</p>
        <p className="text-xs text-slate-500">{m.asset?.name ?? '—'} · {m.asset?.assetCode}</p>
      </div>
    ),
  },
  { key: 'type', header: 'Type', render: (m) => <span className="text-slate-300">{titleCase(m.type)}</span> },
  { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
  { key: 'scheduledDate', header: 'Scheduled', render: (m) => <span className="text-slate-400">{date(m.scheduledDate)}</span> },
  { key: 'cost', header: 'Cost', align: 'right', render: (m) => <span className="font-medium text-slate-200">{currency(m.cost)}</span> },
];

export default function MaintenancePage() {
  const has = useAuthStore((s) => s.hasPermission);
  const { data: assets } = useQuery({ queryKey: ['assets', 'all-min'], queryFn: () => assetApi.list({ limit: 100 }) });
  const { data: vendors } = useQuery({ queryKey: ['vendors', 'all'], queryFn: () => vendorApi.list({ limit: 100 }) });

  const fields: FormFieldDef[] = [
    { name: 'title', label: 'Title', required: true, placeholder: 'e.g. Quarterly service' },
    { name: 'assetId', label: 'Asset', type: 'select', required: true, options: (assets?.data ?? []).map((a: Asset) => ({ value: a.id, label: `${a.name} (${a.assetCode})` })) },
    { name: 'type', label: 'Type', type: 'select', required: true, options: TYPES.map((t) => ({ value: t, label: titleCase(t) })) },
    { name: 'status', label: 'Status', type: 'select', options: STATUSES.map((s) => ({ value: s, label: titleCase(s) })) },
    { name: 'vendorId', label: 'Vendor', type: 'select', options: (vendors?.data ?? []).map((v: Vendor) => ({ value: v.id, label: v.vendorName })) },
    { name: 'cost', label: 'Cost (₹)', type: 'number', placeholder: '0' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Work performed / notes' },
  ];

  return (
    <ResourceManager<MaintenanceRecord>
      title="Maintenance & AMC"
      subtitle="Schedule services, track repairs, warranty claims and annual maintenance contracts."
      icon={<Wrench className="h-5 w-5" />}
      entityName="Maintenance"
      queryKey="maintenance"
      api={maintenanceApi}
      columns={columns}
      fields={fields}
      rowKey={(m) => m.id}
      permissions={{ create: has('maintenance:manage'), edit: has('maintenance:manage'), remove: has('maintenance:manage') }}
      searchPlaceholder="Search maintenance…"
      getEditValues={(m) => ({ title: m.title, assetId: m.asset?.id, type: m.type, status: m.status, vendorId: m.vendor?.id, cost: m.cost })}
    />
  );
}
