import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, Users, ShieldCheck, Building2, MapPin, Plus, Pencil, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi, roleApi, departmentApi, locationApi } from '../../api/resourceApi';
import { PageHeader } from '../../components/common/PageHeader';
import { ResourceManager, type FormFieldDef } from '../../components/common/ResourceManager';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { Tag } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { date, titleCase } from '../../utils/format';
import type { AppUser, RoleSummary, Department, Location } from '../../utils/types';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'locations', label: 'Locations', icon: MapPin },
] as const;
type TabId = (typeof TABS)[number]['id'];

/* ----------------------------- Users tab ----------------------------- */
function UsersTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['users', page], queryFn: () => userApi.list({ page, limit: 10 }) });
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: roleApi.list });
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const save = useMutation({
    mutationFn: (v: Record<string, unknown>) => (editing ? userApi.update(editing.id, v) : userApi.create(v)),
    onSuccess: () => { toast.success(`User ${editing ? 'updated' : 'created'}`); setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });
  const del = useMutation({
    mutationFn: (u: AppUser) => userApi.remove(u.id),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e?.response?.data?.message ?? 'Failed'),
  });

  const roleOptions = (roles ?? []).map((r) => ({ value: r.id, label: r.name }));

  const openCreate = () => { setEditing(null); reset({ name: '', email: '', password: '', roleId: '' }); setOpen(true); };
  const openEdit = (u: AppUser) => { setEditing(u); reset({ name: u.name, email: u.email, roleId: u.role?.id ?? '', password: '' }); setOpen(true); };

  const columns: Column<AppUser>[] = [
    {
      key: 'name', header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <div><p className="font-medium text-slate-100">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <Tag className="text-brand-300">{u.role?.name ?? '—'}</Tag> },
    { key: 'isActive', header: 'Status', render: (u) => <Tag className={u.isActive ? 'text-emerald-300' : 'text-slate-400'}>{u.isActive ? 'Active' : 'Inactive'}</Tag> },
    { key: 'lastLoginAt', header: 'Last login', render: (u) => <span className="text-slate-400">{date(u.lastLoginAt)}</span> },
    {
      key: '__a', header: '', align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={(e) => { e.stopPropagation(); openEdit(u); }} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-brand-300"><Pencil className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); del.mutate(u); }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">Manage platform users and their roles.</p>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>New User</Button>
      </div>
      <DataTable columns={columns} rows={data?.data ?? []} loading={isLoading} rowKey={(u) => u.id} onRowClick={openEdit} />
      <Pagination meta={data?.meta} onPage={setPage} />

      <Modal
        open={open} onClose={() => setOpen(false)}
        title={editing ? 'Edit User' : 'New User'}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={save.isPending} onClick={handleSubmit((v) => save.mutate(Object.fromEntries(Object.entries(v).filter(([, val]) => val !== ''))))}>{editing ? 'Save' : 'Create'}</Button>
        </>}
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message as string}><Input {...register('name', { required: 'Required' })} /></Field>
          <Field label="Email" error={errors.email?.message as string}><Input type="email" {...register('email', { required: 'Required' })} /></Field>
          <Field label="Role" error={errors.roleId?.message as string}><Select options={roleOptions} placeholder="Select role" {...register('roleId', { required: 'Required' })} /></Field>
          <Field label={editing ? 'New password (optional)' : 'Password'} error={errors.password?.message as string}>
            <Input type="password" placeholder="••••••" {...register('password', { required: !editing && 'Required' })} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

/* ----------------------------- Roles tab ----------------------------- */
function RolesTab() {
  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: roleApi.list });
  if (isLoading) return <div className="card p-8 text-center text-sm text-slate-500">Loading roles…</div>;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(roles ?? []).map((r: RoleSummary, i) => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card card-hover p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand-soft text-brand-300 ring-1 ring-white/10"><ShieldCheck className="h-5 w-5" /></div>
            {r.isSystem && <Tag>System</Tag>}
          </div>
          <h3 className="mt-3 text-base font-semibold text-white">{r.name}</h3>
          <p className="mt-0.5 text-sm text-slate-400">{r.description}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{r.userCount} user(s)</span>
            <span className="font-medium text-brand-300">{r.permissions.length} permissions</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.permissions.slice(0, 4).map((p) => (
              <span key={p} className="chip bg-white/5 text-[10px] text-slate-400 ring-1 ring-white/10"><Check className="h-3 w-3" /> {titleCase(p.split(':')[1] ?? p)}</span>
            ))}
            {r.permissions.length > 4 && <span className="chip bg-white/5 text-[10px] text-slate-500 ring-1 ring-white/10">+{r.permissions.length - 4}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------- Departments / Locations ------------------------- */
const deptColumns: Column<Department>[] = [
  { key: 'name', header: 'Department', render: (d) => <span className="font-medium text-slate-100">{d.name}</span> },
  { key: 'code', header: 'Code', render: (d) => <span className="font-mono text-xs text-slate-400">{d.code}</span> },
  { key: 'costCenter', header: 'Cost Center', render: (d) => <span className="text-slate-300">{d.costCenter ?? '—'}</span> },
  { key: 'employees', header: 'Employees', render: (d) => <span className="text-slate-300">{d._count?.employees ?? 0}</span> },
];
const deptFields: FormFieldDef[] = [
  { name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code', required: true }, { name: 'costCenter', label: 'Cost center' },
];
const locColumns: Column<Location>[] = [
  { key: 'name', header: 'Location', render: (l) => <span className="font-medium text-slate-100">{l.name}</span> },
  { key: 'code', header: 'Code', render: (l) => <span className="font-mono text-xs text-slate-400">{l.code}</span> },
  { key: 'type', header: 'Type', render: (l) => <Tag>{l.type ?? '—'}</Tag> },
  { key: 'city', header: 'City', render: (l) => <span className="text-slate-300">{l.city ?? '—'}</span> },
  { key: 'assets', header: 'Assets', render: (l) => <span className="text-slate-300">{l._count?.assets ?? 0}</span> },
];
const locFields: FormFieldDef[] = [
  { name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code', required: true },
  { name: 'type', label: 'Type', placeholder: 'HQ / BRANCH / WAREHOUSE' }, { name: 'city', label: 'City' }, { name: 'country', label: 'Country' },
];

export default function AdministrationPage() {
  const has = useAuthStore((s) => s.hasPermission);
  const [tab, setTab] = useState<TabId>('users');
  const canSettings = has('admin:settings');

  return (
    <div>
      <PageHeader title="Administration" subtitle="Manage users, roles, departments and locations." icon={<Settings className="h-5 w-5" />} />

      <div className="mb-5 flex flex-wrap gap-1 rounded-2xl bg-ink-900/50 p-1.5 ring-1 ring-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab === t.id && <motion.div layoutId="admin-tab" className="absolute inset-0 rounded-xl bg-gradient-brand-soft ring-1 ring-brand-500/30" transition={{ type: 'spring', damping: 24, stiffness: 320 }} />}
            <t.icon className="relative h-4 w-4" />
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {tab === 'users' && <UsersTab />}
        {tab === 'roles' && <RolesTab />}
        {tab === 'departments' && (
          <ResourceManager<Department>
            embedded title="Departments" entityName="Department" icon={null} queryKey="departments"
            api={departmentApi} columns={deptColumns} fields={deptFields} rowKey={(d) => d.id}
            permissions={{ create: canSettings, edit: canSettings, remove: canSettings }}
          />
        )}
        {tab === 'locations' && (
          <ResourceManager<Location>
            embedded title="Locations" entityName="Location" icon={null} queryKey="locations"
            api={locationApi} columns={locColumns} fields={locFields} rowKey={(l) => l.id}
            permissions={{ create: canSettings, edit: canSettings, remove: canSettings }}
          />
        )}
      </motion.div>
    </div>
  );
}
