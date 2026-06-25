import { Tags } from 'lucide-react';
import { ResourceManager, type FormFieldDef } from '../../components/common/ResourceManager';
import { categoryApi } from '../../api/resourceApi';
import { useAuthStore } from '../../store/authStore';
import type { Column } from '../../components/common/DataTable';
import type { Category } from '../../utils/types';

const columns: Column<Category>[] = [
  { key: 'name', header: 'Category', render: (c) => <span className="font-medium text-slate-100">{c.name}</span> },
  { key: 'code', header: 'Code', render: (c) => <span className="font-mono text-xs text-slate-400">{c.code}</span> },
  { key: 'assets', header: 'Assets', render: (c) => <span className="text-slate-300">{c._count?.assets ?? 0}</span> },
  { key: 'depreciationRate', header: 'Depreciation', render: (c) => <span className="text-slate-300">{c.depreciationRate}% / yr</span> },
  { key: 'usefulLifeYears', header: 'Useful Life', render: (c) => <span className="text-slate-400">{c.usefulLifeYears} yrs</span> },
];

const fields: FormFieldDef[] = [
  { name: 'name', label: 'Name', required: true, placeholder: 'e.g. Laptops' },
  { name: 'code', label: 'Code', required: true, placeholder: 'e.g. LAP' },
  { name: 'depreciationRate', label: 'Depreciation rate (%)', type: 'number', placeholder: '25' },
  { name: 'usefulLifeYears', label: 'Useful life (years)', type: 'number', placeholder: '5' },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
];

export default function CategoriesPage() {
  const has = useAuthStore((s) => s.hasPermission);
  return (
    <ResourceManager<Category>
      title="Asset Categories"
      subtitle="Classify assets and configure depreciation policy per category."
      icon={<Tags className="h-5 w-5" />}
      entityName="Category"
      queryKey="categories"
      api={categoryApi}
      columns={columns}
      fields={fields}
      rowKey={(c) => c.id}
      permissions={{ create: has('category:manage'), edit: has('category:manage'), remove: has('category:manage') }}
      searchPlaceholder="Search categories…"
    />
  );
}
