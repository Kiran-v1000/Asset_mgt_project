import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { ResourceManager, type FormFieldDef } from '../../components/common/ResourceManager';
import { requestApi, employeeApi } from '../../api/resourceApi';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '../../components/ui/Badge';
import { date, titleCase } from '../../utils/format';
import type { Column } from '../../components/common/DataTable';
import type { AssetRequest, Employee } from '../../utils/types';

const TYPES = ['NEW_ASSET', 'REPLACEMENT', 'REPAIR', 'RETURN'];

const columns: Column<AssetRequest>[] = [
  { key: 'requestCode', header: 'Request', render: (r) => <span className="font-mono text-xs text-slate-300">{r.requestCode}</span> },
  { key: 'employee', header: 'Requested by', render: (r) => <span className="text-slate-200">{r.employee?.name ?? '—'}</span> },
  { key: 'type', header: 'Type', render: (r) => <span className="text-slate-300">{titleCase(r.type)}</span> },
  { key: 'categoryName', header: 'Category', render: (r) => <span className="text-slate-400">{r.categoryName ?? '—'}</span> },
  { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'createdAt', header: 'Raised', render: (r) => <span className="text-slate-400">{date(r.createdAt)}</span> },
];

export default function RequestsPage() {
  const has = useAuthStore((s) => s.hasPermission);
  const { data: employees } = useQuery({ queryKey: ['employees', 'all'], queryFn: () => employeeApi.list({ limit: 100 }) });

  const fields: FormFieldDef[] = [
    { name: 'employeeId', label: 'Employee', type: 'select', required: true, options: (employees?.data ?? []).map((e: Employee) => ({ value: e.id, label: `${e.name} (${e.employeeCode})` })) },
    { name: 'type', label: 'Request type', type: 'select', options: TYPES.map((t) => ({ value: t, label: titleCase(t) })) },
    { name: 'categoryName', label: 'Category', placeholder: 'e.g. Laptops' },
    { name: 'justification', label: 'Justification', type: 'textarea', placeholder: 'Reason for the request' },
  ];

  return (
    <ResourceManager<AssetRequest>
      title="Asset Requests"
      subtitle="Employee self-service requests for new, replacement or repair of assets."
      icon={<FileText className="h-5 w-5" />}
      entityName="Request"
      queryKey="requests"
      api={requestApi}
      columns={columns}
      fields={fields}
      rowKey={(r) => r.id}
      permissions={{ create: has('request:create'), edit: has('request:approve'), remove: has('request:approve') }}
      searchPlaceholder="Search requests…"
      getEditValues={(r) => ({ employeeId: r.employee?.id, type: r.type, categoryName: r.categoryName, justification: r.justification })}
    />
  );
}
