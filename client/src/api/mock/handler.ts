/* Routes API calls to the in-memory dataset when VITE_USE_MOCK=true. */
import { buildDataset, newId, ALL_PERMISSIONS, type MockDB } from './dataset';
import type { ApiEnvelope } from '../../utils/types';

const db: MockDB = buildDataset();

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));

interface Req { method: string; url: string; params?: Record<string, unknown>; data?: Record<string, unknown> }

const paginate = <T extends Record<string, unknown>>(
  rows: T[],
  params: Record<string, unknown> = {},
  searchFields: string[] = [],
  filters: string[] = [],
): ApiEnvelope<T[]> => {
  let result = [...rows];
  const search = String(params.search ?? '').toLowerCase().trim();
  if (search && searchFields.length) {
    result = result.filter((r) =>
      searchFields.some((f) => String(r[f] ?? '').toLowerCase().includes(search)),
    );
  }
  for (const f of filters) {
    if (params[f]) result = result.filter((r) => r[f] === params[f]);
  }
  const sort = String(params.sort ?? 'createdAt');
  const order = params.order === 'asc' ? 1 : -1;
  result.sort((a, b) => (String(a[sort] ?? '') > String(b[sort] ?? '') ? order : -order));

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 12));
  const total = result.length;
  const data = result.slice((page - 1) * limit, page * limit);
  return { success: true, data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

const RESOURCES: Record<string, { key: keyof MockDB; search: string[]; filters?: string[] }> = {
  assets: { key: 'assets', search: ['name', 'assetCode', 'serialNumber', 'manufacturer'], filters: ['status', 'categoryId'] },
  employees: { key: 'employees', search: ['name', 'employeeCode', 'email', 'designation'] },
  vendors: { key: 'vendors', search: ['vendorName', 'code', 'contactPerson', 'email'] },
  categories: { key: 'categories', search: ['name', 'code'] },
  departments: { key: 'departments', search: ['name', 'code'] },
  locations: { key: 'locations', search: ['name', 'code', 'city', 'country'] },
  maintenance: { key: 'maintenance', search: ['title', 'type', 'status'] },
  requests: { key: 'requests', search: ['requestCode', 'categoryName', 'justification'], filters: ['status'] },
  assignments: { key: 'assignments', search: [], filters: ['status'] },
  users: { key: 'users', search: ['name', 'email'] },
  'audit-logs': { key: 'auditLogs', search: ['actorName', 'summary', 'entity'], filters: ['module'] },
};

// Link the demo principal to an employee that actually holds assets, so the
// self-service "My Assets" portal always has data to show.
const selfEmployee =
  db.employees.find((e) => db.assignments.some((a) => a.status === 'ACTIVE' && a.employee?.id === e.id)) ??
  db.employees[0];

const me = {
  id: 'usr_me', name: 'System Administrator', email: 'admin@eams.io', avatarUrl: null,
  role: { id: 'rol_sa', name: 'Super Admin' }, organizationId: 'org_demo', permissions: ALL_PERMISSIONS,
  employeeId: selfEmployee.id, employeeName: selfEmployee.name,
};

// ---- Reservations (in-memory) ----
interface MockReservation {
  id: string; status: string; reservedForDate?: string; notes?: string; createdAt: string;
  asset?: { id: string; name: string; assetCode: string };
  employee?: { id: string; name: string; employeeCode: string };
}
const reservations: MockReservation[] = db.assets
  .filter((a) => a.status === 'RESERVED')
  .slice(0, 4)
  .map((a) => ({
    id: newId('rsv'), status: 'RESERVED', reservedForDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    asset: { id: a.id, name: a.name, assetCode: a.assetCode },
    employee: { id: selfEmployee.id, name: selfEmployee.name, employeeCode: selfEmployee.employeeCode },
  }));

const dashboardOverview = () => {
  const a = db.assets;
  const by = (s: string) => a.filter((x) => x.status === s).length;
  const total = a.length;
  const assigned = by('ASSIGNED');
  const statusCounts = a.reduce<Record<string, number>>((m, x) => ((m[x.status] = (m[x.status] ?? 0) + 1), m), {});
  const catCounts = a.reduce<Record<string, number>>((m, x) => ((m[x.category?.name ?? '—'] = (m[x.category?.name ?? '—'] ?? 0) + 1), m), {});
  return {
    kpis: {
      totalAssets: total,
      totalValue: a.reduce((s, x) => s + x.currentValue, 0),
      purchaseValue: a.reduce((s, x) => s + x.purchaseCost, 0),
      assigned, available: by('AVAILABLE'), inMaintenance: by('IN_MAINTENANCE'),
      utilizationRate: total ? Math.round((assigned / total) * 100) : 0,
      activeAssignments: db.assignments.filter((x) => x.status === 'ACTIVE').length,
      openMaintenance: db.maintenance.filter((x) => x.status === 'SCHEDULED' || x.status === 'IN_PROGRESS').length,
      employees: db.employees.length, vendors: db.vendors.length,
    },
    statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    categoryBreakdown: Object.entries(catCounts).map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count).slice(0, 8),
    expiringWarranties: a
      .filter((x) => x.warrantyExpiry && new Date(x.warrantyExpiry) > new Date() && new Date(x.warrantyExpiry) < new Date(Date.now() + 60 * 86400000))
      .sort((x, y) => +new Date(x.warrantyExpiry!) - +new Date(y.warrantyExpiry!))
      .slice(0, 8)
      .map((x) => ({ id: x.id, name: x.name, assetCode: x.assetCode, warrantyExpiry: x.warrantyExpiry! })),
    recentActivity: db.auditLogs.slice(0, 8),
  };
};

const dashboardTrend = () => {
  const buckets = new Map<string, { count: number; spend: number }>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, { count: 0, spend: 0 });
  }
  for (const a of db.assets) {
    if (!a.purchaseDate) continue;
    const d = new Date(a.purchaseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = buckets.get(key);
    if (b) { b.count++; b.spend += a.purchaseCost; }
  }
  return Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));
};

export async function mockHandle<T>(req: Req): Promise<ApiEnvelope<T>> {
  await delay();
  const { method, url, params = {}, data = {} } = req;
  const seg = url.split('/').filter(Boolean); // e.g. ['assets','id']

  // ---- Auth ----
  if (url === '/auth/login') {
    const user = db.users.find((u) => u.email === String(data.email).toLowerCase());
    if (!String(data.password)) throw { response: { status: 422, data: { message: 'Password required' } } };
    const resolved = user
      ? { ...me, id: user.id, name: user.name, email: user.email, role: user.role!, permissions: db.roles.find((r) => r.id === user.role?.id)?.permissions ?? ALL_PERMISSIONS }
      : me;
    return { success: true, data: { accessToken: 'mock.jwt.token', refreshToken: 'mock.refresh', user: resolved } as T };
  }
  if (url === '/auth/me') return { success: true, data: me as T };
  if (url === '/auth/logout') return { success: true, data: null as T };

  // ---- Dashboard ----
  if (url === '/dashboard/overview') return { success: true, data: dashboardOverview() as T };
  if (url === '/dashboard/trend') return { success: true, data: dashboardTrend() as T };

  // ---- Roles (read) ----
  if (url === '/roles') return { success: true, data: db.roles as T };

  // ---- Assignments: assign / return ----
  if (url === '/assignments' && method === 'post') {
    const asset = db.assets.find((a) => a.id === data.assetId);
    const emp = db.employees.find((e) => e.id === data.employeeId);
    if (asset && emp) {
      asset.status = 'ASSIGNED';
      asset.assignedTo = { id: emp.id, name: emp.name, employeeCode: emp.employeeCode };
      const row = {
        id: newId('asg'), status: 'ACTIVE', assignedDate: new Date().toISOString(),
        expectedReturnDate: data.expectedReturnDate as string,
        asset: { id: asset.id, name: asset.name, assetCode: asset.assetCode, status: asset.status },
        employee: { id: emp.id, name: emp.name, employeeCode: emp.employeeCode },
      };
      db.assignments.unshift(row);
      return { success: true, data: row as T };
    }
  }
  if (seg[0] === 'assignments' && seg[2] === 'return' && method === 'post') {
    const asg = db.assignments.find((x) => x.id === seg[1]);
    if (asg) {
      asg.status = 'RETURNED';
      asg.actualReturnDate = new Date().toISOString();
      const asset = db.assets.find((a) => a.id === asg.asset?.id);
      if (asset) { asset.status = 'AVAILABLE'; asset.assignedTo = null; }
      return { success: true, data: asg as T };
    }
  }

  // ---- Reservations ----
  if (seg[0] === 'reservations') {
    if (method === 'get' && seg.length === 1) {
      return paginate(reservations as unknown as Record<string, unknown>[], params, [], ['status']) as ApiEnvelope<T>;
    }
    if (method === 'post' && seg.length === 1) {
      const asset = db.assets.find((a) => a.id === data.assetId);
      if (asset) {
        asset.status = 'RESERVED';
        const row: MockReservation = {
          id: newId('rsv'), status: 'RESERVED', reservedForDate: data.reservedForDate as string,
          notes: data.notes as string, createdAt: new Date().toISOString(),
          asset: { id: asset.id, name: asset.name, assetCode: asset.assetCode },
          employee: { id: selfEmployee.id, name: selfEmployee.name, employeeCode: selfEmployee.employeeCode },
        };
        reservations.unshift(row);
        return { success: true, data: row as T };
      }
    }
    if (method === 'post' && seg[2] === 'cancel') {
      const r = reservations.find((x) => x.id === seg[1]);
      if (r) {
        r.status = 'CANCELLED';
        const asset = db.assets.find((a) => a.id === r.asset?.id);
        if (asset && asset.status === 'RESERVED') asset.status = 'AVAILABLE';
        return { success: true, data: r as T };
      }
    }
  }

  // ---- Generic CRUD ----
  const resource = RESOURCES[seg[0]];
  if (resource) {
    const collection = db[resource.key] as unknown as Record<string, unknown>[];

    if (method === 'get' && seg.length === 1) {
      return paginate(collection, params, resource.search, resource.filters) as ApiEnvelope<T>;
    }
    if (method === 'get' && seg.length === 2) {
      const row = collection.find((r) => r.id === seg[1]);
      return { success: true, data: row as T };
    }
    if (method === 'post') {
      const row = { id: newId(seg[0].slice(0, 3)), createdAt: new Date().toISOString(), ...enrich(seg[0], data) };
      collection.unshift(row);
      return { success: true, data: row as T };
    }
    if (method === 'patch' || method === 'put') {
      const idx = collection.findIndex((r) => r.id === seg[1]);
      if (idx >= 0) { collection[idx] = { ...collection[idx], ...enrich(seg[0], data) }; return { success: true, data: collection[idx] as T }; }
    }
    if (method === 'delete') {
      const idx = collection.findIndex((r) => r.id === seg[1]);
      if (idx >= 0) collection.splice(idx, 1);
      return { success: true, data: { id: seg[1] } as T };
    }
  }

  throw { response: { status: 404, data: { message: `Mock: no handler for ${method.toUpperCase()} ${url}` } } };
}

/** Resolve embedded relation snapshots so freshly-created rows render like listed ones. */
function enrich(resource: string, data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  if (resource === 'assets') {
    const cat = db.categories.find((c) => c.id === data.categoryId);
    if (cat) out.category = { id: cat.id, name: cat.name, code: cat.code, icon: cat.icon };
    out.assetCode = out.assetCode || `AST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    out.status = out.status || 'AVAILABLE';
    out.condition = out.condition || 'NEW';
    out.currentValue = out.currentValue ?? out.purchaseCost ?? 0;
  }
  if (resource === 'requests') out.requestCode = out.requestCode || `REQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return out;
}
