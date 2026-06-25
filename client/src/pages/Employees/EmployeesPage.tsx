import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { ResourceManager, type FormFieldDef } from '../../components/common/ResourceManager';
import { employeeApi, departmentApi, locationApi } from '../../api/resourceApi';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { Tag } from '../../components/ui/Badge';
import type { Column } from '../../components/common/DataTable';
import type { Employee, Department, Location } from '../../utils/types';

const columns: Column<Employee>[] = [
  {
    key: 'name', header: 'Employee',
    render: (e) => (
      <div className="flex items-center gap-3">
        <Avatar name={e.name} size="sm" />
        <div>
          <p className="font-medium text-slate-100">{e.name}</p>
          <p className="font-mono text-xs text-slate-500">{e.employeeCode}</p>
        </div>
      </div>
    ),
  },
  { key: 'designation', header: 'Designation', render: (e) => <span className="text-slate-300">{e.designation ?? '—'}</span> },
  { key: 'department', header: 'Department', render: (e) => <span className="text-slate-300">{e.department?.name ?? '—'}</span> },
  { key: 'email', header: 'Email', render: (e) => <span className="text-slate-400">{e.email}</span> },
  { key: 'isActive', header: 'Status', render: (e) => <Tag className={e.isActive ? 'text-emerald-300' : 'text-slate-400'}>{e.isActive ? 'Active' : 'Inactive'}</Tag> },
];

export default function EmployeesPage() {
  const has = useAuthStore((s) => s.hasPermission);
  const { data: depts } = useQuery({ queryKey: ['departments', 'all'], queryFn: () => departmentApi.list({ limit: 100 }) });
  const { data: locs } = useQuery({ queryKey: ['locations', 'all'], queryFn: () => locationApi.list({ limit: 100 }) });

  const fields: FormFieldDef[] = [
    { name: 'name', label: 'Full name', required: true, placeholder: 'Jane Doe' },
    { name: 'employeeCode', label: 'Employee code', required: true, placeholder: 'EMP-1001' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jane@company.com' },
    { name: 'designation', label: 'Designation', placeholder: 'Software Engineer' },
    { name: 'departmentId', label: 'Department', type: 'select', options: (depts?.data ?? []).map((d: Department) => ({ value: d.id, label: d.name })) },
    { name: 'locationId', label: 'Location', type: 'select', options: (locs?.data ?? []).map((l: Location) => ({ value: l.id, label: l.name })) },
    { name: 'phone', label: 'Phone', placeholder: '+91 …' },
  ];

  return (
    <ResourceManager<Employee>
      title="Employees"
      subtitle="Directory of asset holders across departments and locations."
      icon={<Users className="h-5 w-5" />}
      entityName="Employee"
      queryKey="employees"
      api={employeeApi}
      columns={columns}
      fields={fields}
      rowKey={(e) => e.id}
      permissions={{ create: has('employee:manage'), edit: has('employee:manage'), remove: has('employee:manage') }}
      searchPlaceholder="Search employees…"
      getEditValues={(e) => ({
        name: e.name, employeeCode: e.employeeCode, email: e.email, designation: e.designation,
        departmentId: e.department?.id, locationId: e.location?.id, phone: e.phone,
      })}
    />
  );
}
