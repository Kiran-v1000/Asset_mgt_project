import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader';
import { DataTable, type Column } from './DataTable';
import { Pagination } from '../ui/Pagination';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { useDebounce } from '../../hooks/useDebounce';
import type { ApiEnvelope } from '../../utils/types';

export interface FormFieldDef {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
}

interface ResourceApiShape<T> {
  list: (params?: Record<string, unknown>) => Promise<ApiEnvelope<T[]>>;
  create: (data: Record<string, unknown>) => Promise<T>;
  update: (id: string, data: Record<string, unknown>) => Promise<T>;
  remove: (id: string) => Promise<{ id: string }>;
}

interface ResourceManagerProps<T> {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  entityName: string;
  queryKey: string;
  api: ResourceApiShape<T>;
  columns: Column<T>[];
  fields: FormFieldDef[];
  rowKey: (row: T) => string;
  permissions?: { create?: boolean; edit?: boolean; remove?: boolean };
  searchPlaceholder?: string;
  getEditValues?: (row: T) => Record<string, unknown>;
  extraActions?: ReactNode;
  /** Hide the page header (e.g. when rendered inside a tabbed page). */
  embedded?: boolean;
}

export function ResourceManager<T>({
  title, subtitle, icon, entityName, queryKey, api, columns, fields, rowKey,
  permissions = {}, searchPlaceholder, getEditValues, extraActions, embedded,
}: ResourceManagerProps<T>) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [queryKey, page, search],
    queryFn: () => api.list({ page, limit: 10, search }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      editing ? api.update(rowKey(editing), values) : api.create(values),
    onSuccess: () => {
      toast.success(`${entityName} ${editing ? 'updated' : 'created'}`);
      setModalOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: T) => api.remove(rowKey(row)),
    onSuccess: () => {
      toast.success(`${entityName} deleted`);
      setDeleting(null);
      invalidate();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message ?? 'Unable to delete'),
  });

  const openCreate = () => {
    setEditing(null);
    reset(Object.fromEntries(fields.map((f) => [f.name, ''])));
    setModalOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    const base = getEditValues ? getEditValues(row) : (row as Record<string, unknown>);
    reset(Object.fromEntries(fields.map((f) => [f.name, base[f.name] ?? ''])));
    setModalOpen(true);
  };

  const onSubmit = (values: Record<string, unknown>) => {
    // strip empty strings → undefined so optional fields aren't sent as ""
    const cleaned = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === '' ? undefined : v]),
    );
    saveMutation.mutate(cleaned);
  };

  const allColumns = useMemo<Column<T>[]>(() => {
    if (!permissions.edit && !permissions.remove) return columns;
    return [
      ...columns,
      {
        key: '__actions',
        header: '',
        align: 'right',
        render: (row: T) => (
          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {permissions.edit && (
              <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-brand-300" title="Edit">
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {permissions.remove && (
              <button onClick={(e) => { e.stopPropagation(); setDeleting(row); }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, permissions.edit, permissions.remove]);

  return (
    <div>
      {!embedded && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          actions={
            <>
              {extraActions}
              {permissions.create && (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                  New {entityName}
                </Button>
              )}
            </>
          }
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchRaw}
              onChange={(e) => { setSearchRaw(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
              className="input pl-10"
            />
          </div>
          {embedded && permissions.create ? (
            <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>New {entityName}</Button>
          ) : (
            isFetching && <span className="text-xs text-slate-500">Updating…</span>
          )}
        </div>

        <DataTable
          columns={allColumns}
          rows={data?.data ?? []}
          loading={isLoading}
          rowKey={rowKey}
          onRowClick={permissions.edit ? openEdit : undefined}
        />
        <Pagination meta={data?.meta} onPage={setPage} />
      </motion.div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editing ? 'Edit' : 'New'} ${entityName}`}
        subtitle={editing ? 'Update the details below.' : `Add a new ${entityName.toLowerCase()} to the system.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} onClick={handleSubmit(onSubmit)}>
              {editing ? 'Save changes' : `Create ${entityName}`}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field
              key={f.name}
              label={f.label}
              error={errors[f.name]?.message as string}
              className={f.fullWidth || f.type === 'textarea' ? 'sm:col-span-2' : ''}
            >
              {f.type === 'select' ? (
                <Select
                  options={f.options ?? []}
                  placeholder={f.placeholder ?? 'Select…'}
                  {...register(f.name, { required: f.required && `${f.label} is required` })}
                />
              ) : f.type === 'textarea' ? (
                <Textarea placeholder={f.placeholder} {...register(f.name, { required: f.required && `${f.label} is required` })} />
              ) : (
                <Input
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder}
                  {...register(f.name, {
                    required: f.required && `${f.label} is required`,
                    valueAsNumber: f.type === 'number',
                  })}
                />
              )}
            </Field>
          ))}
        </form>
      </Modal>

      {/* Delete confirm (inline to keep row context) */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${entityName}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleting && deleteMutation.mutate(deleting)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-400">
          This will permanently remove the {entityName.toLowerCase()}. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
