import { http } from './client';
import type { ApiEnvelope } from '../utils/types';

export type Params = Record<string, unknown>;

/** Generic REST resource client — one factory powers every list/detail page. */
export const createResourceApi = <T>(path: string) => ({
  list: (params?: Params): Promise<ApiEnvelope<T[]>> => http.get<T[]>(`/${path}`, params),
  get: (id: string) => http.get<T>(`/${path}/${id}`).then((r) => r.data),
  create: (data: Params) => http.post<T>(`/${path}`, data).then((r) => r.data),
  update: (id: string, data: Params) => http.patch<T>(`/${path}/${id}`, data).then((r) => r.data),
  remove: (id: string) => http.del<{ id: string }>(`/${path}/${id}`).then((r) => r.data),
});

// Concrete resource clients
import type {
  Asset, Assignment, AuditLog, Category, Department, Employee, Location,
  MaintenanceRecord, AppUser, Vendor, AssetRequest, RoleSummary, Reservation,
} from '../utils/types';

export const assetApi = createResourceApi<Asset>('assets');
export const employeeApi = createResourceApi<Employee>('employees');
export const vendorApi = createResourceApi<Vendor>('vendors');
export const categoryApi = createResourceApi<Category>('categories');
export const departmentApi = createResourceApi<Department>('departments');
export const locationApi = createResourceApi<Location>('locations');
export const maintenanceApi = createResourceApi<MaintenanceRecord>('maintenance');
export const requestApi = createResourceApi<AssetRequest>('requests');
export const assignmentApi = createResourceApi<Assignment>('assignments');
export const userApi = createResourceApi<AppUser>('users');
export const auditApi = createResourceApi<AuditLog>('audit-logs');

// Assignment-specific actions
export const assignmentActions = {
  assign: (data: Params) => http.post<Assignment>('/assignments', data).then((r) => r.data),
  returnAsset: (id: string, data: Params) =>
    http.post<Assignment>(`/assignments/${id}/return`, data).then((r) => r.data),
};

export const roleApi = {
  list: () => http.get<RoleSummary[]>('/roles').then((r) => r.data),
};

export const reservationApi = createResourceApi<Reservation>('reservations');
export const reservationActions = {
  reserve: (data: Params) => http.post<Reservation>('/reservations', data).then((r) => r.data),
  cancel: (id: string) => http.post<Reservation>(`/reservations/${id}/cancel`, {}).then((r) => r.data),
};
