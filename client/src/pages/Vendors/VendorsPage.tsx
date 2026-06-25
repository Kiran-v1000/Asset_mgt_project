import { Store, Star } from 'lucide-react';
import { ResourceManager, type FormFieldDef } from '../../components/common/ResourceManager';
import { vendorApi } from '../../api/resourceApi';
import { useAuthStore } from '../../store/authStore';
import { Tag } from '../../components/ui/Badge';
import type { Column } from '../../components/common/DataTable';
import type { Vendor } from '../../utils/types';

const columns: Column<Vendor>[] = [
  { key: 'vendorName', header: 'Vendor', render: (v) => <span className="font-medium text-slate-100">{v.vendorName}</span> },
  { key: 'code', header: 'Code', render: (v) => <span className="font-mono text-xs text-slate-400">{v.code}</span> },
  { key: 'contactPerson', header: 'Contact', render: (v) => <span className="text-slate-300">{v.contactPerson ?? '—'}</span> },
  { key: 'email', header: 'Email', render: (v) => <span className="text-slate-400">{v.email ?? '—'}</span> },
  {
    key: 'rating', header: 'Rating',
    render: (v) => (
      <span className="inline-flex items-center gap-1 text-amber-300">
        <Star className="h-3.5 w-3.5 fill-amber-300" /> {(v.rating ?? 0).toFixed(1)}
      </span>
    ),
  },
  { key: 'isActive', header: 'Status', render: (v) => <Tag className={v.isActive ? 'text-emerald-300' : 'text-slate-400'}>{v.isActive ? 'Active' : 'Inactive'}</Tag> },
];

const fields: FormFieldDef[] = [
  { name: 'vendorName', label: 'Vendor name', required: true, placeholder: 'e.g. Dell Technologies' },
  { name: 'code', label: 'Code', required: true, placeholder: 'e.g. DELL' },
  { name: 'contactPerson', label: 'Contact person', placeholder: 'Full name' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'sales@vendor.com' },
  { name: 'phone', label: 'Phone', placeholder: '+91 …' },
  { name: 'rating', label: 'Rating (0–5)', type: 'number', placeholder: '4.5' },
  { name: 'address', label: 'Address', type: 'textarea', placeholder: 'Registered address' },
];

export default function VendorsPage() {
  const has = useAuthStore((s) => s.hasPermission);
  return (
    <ResourceManager<Vendor>
      title="Vendor Management"
      subtitle="Maintain your supplier directory, contacts and performance ratings."
      icon={<Store className="h-5 w-5" />}
      entityName="Vendor"
      queryKey="vendors"
      api={vendorApi}
      columns={columns}
      fields={fields}
      rowKey={(v) => v.id}
      permissions={{ create: has('vendor:manage'), edit: has('vendor:manage'), remove: has('vendor:manage') }}
      searchPlaceholder="Search vendors…"
    />
  );
}
