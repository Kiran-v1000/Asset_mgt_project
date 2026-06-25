/**
 * In-memory demo dataset mirroring the backend seed. Powers the app when
 * VITE_USE_MOCK=true so the full UI is explorable without a database.
 */
import type {
  Asset, AssetStatus, AssetCondition, Assignment, AuditLog, Category,
  Department, Employee, Location, MaintenanceRecord, AppUser, RoleSummary,
  Vendor, AssetRequest,
} from '../../utils/types';

let counter = 1;
const id = (p: string) => `${p}_${(counter++).toString(36)}${Date.now().toString(36).slice(-3)}`;
const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const code = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const iso = (d: Date) => d.toISOString();
const monthsAgo = (m: number) => new Date(new Date().setMonth(new Date().getMonth() - m));
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);

export interface MockDB {
  categories: Category[];
  vendors: Vendor[];
  departments: Department[];
  locations: Location[];
  employees: Employee[];
  assets: Asset[];
  assignments: Assignment[];
  maintenance: MaintenanceRecord[];
  requests: AssetRequest[];
  users: AppUser[];
  roles: RoleSummary[];
  auditLogs: AuditLog[];
}

export const ALL_PERMISSIONS = [
  'dashboard:view', 'asset:view', 'asset:create', 'asset:update', 'asset:delete', 'asset:assign',
  'category:manage', 'employee:view', 'employee:manage', 'vendor:view', 'vendor:manage',
  'request:view', 'request:create', 'request:approve', 'maintenance:view', 'maintenance:manage',
  'audit:view', 'report:view', 'admin:users', 'admin:roles', 'admin:settings',
];

export const buildDataset = (): MockDB => {
  const catData = [
    { name: 'Laptops', code: 'LAP', icon: 'laptop', usefulLifeYears: 4, depreciationRate: 25 },
    { name: 'Desktops', code: 'DSK', icon: 'monitor', usefulLifeYears: 5, depreciationRate: 20 },
    { name: 'Monitors', code: 'MON', icon: 'monitor', usefulLifeYears: 6, depreciationRate: 16 },
    { name: 'Mobile Devices', code: 'MOB', icon: 'smartphone', usefulLifeYears: 3, depreciationRate: 33 },
    { name: 'Networking', code: 'NET', icon: 'router', usefulLifeYears: 7, depreciationRate: 14 },
    { name: 'Servers', code: 'SRV', icon: 'server', usefulLifeYears: 6, depreciationRate: 16 },
    { name: 'Printers', code: 'PRN', icon: 'printer', usefulLifeYears: 5, depreciationRate: 20 },
    { name: 'Furniture', code: 'FUR', icon: 'armchair', usefulLifeYears: 10, depreciationRate: 10 },
    { name: 'Vehicles', code: 'VEH', icon: 'car', usefulLifeYears: 8, depreciationRate: 12 },
    { name: 'Lab Equipment', code: 'LAB', icon: 'flask', usefulLifeYears: 8, depreciationRate: 12 },
  ];
  const categories: Category[] = catData.map((c) => ({ id: id('cat'), ...c, _count: { assets: 0 } }));

  const vendors: Vendor[] = [
    ['Dell Technologies', 'DELL', 'Suresh K', 4.6], ['HP Enterprise', 'HPE', 'Megha R', 4.4],
    ['Lenovo India', 'LEN', 'Arun P', 4.2], ['Cisco Systems', 'CSC', 'Neha S', 4.7],
    ['Apple Authorised', 'APL', 'Vikram J', 4.8], ['Godrej Interio', 'GDR', 'Latha M', 4.0],
  ].map(([vendorName, c, contactPerson, rating]) => ({
    id: id('ven'), vendorName: vendorName as string, code: c as string, contactPerson: contactPerson as string,
    email: `${(c as string).toLowerCase()}@partner.com`, phone: `+91 80 ${rnd(1000, 9999)} ${rnd(1000, 9999)}`,
    rating: rating as number, isActive: true,
  }));

  const departments: Department[] = [
    ['Information Technology', 'IT'], ['Engineering', 'ENG'], ['Finance', 'FIN'],
    ['Human Resources', 'HR'], ['Operations', 'OPS'], ['Sales & Marketing', 'SAL'],
  ].map(([name, c], i) => ({ id: id('dep'), name, code: c, costCenter: `CC-${(i + 1) * 100}`, _count: { employees: 0 } }));

  const locations: Location[] = [
    ['Bangalore HQ', 'BLR', 'HQ', 'Bangalore', 'India'], ['Pune Office', 'PUN', 'BRANCH', 'Pune', 'India'],
    ['Central Warehouse', 'WH1', 'WAREHOUSE', 'Bangalore', 'India'], ['Frankfurt Office', 'FRA', 'BRANCH', 'Frankfurt', 'Germany'],
  ].map(([name, c, type, city, country]) => ({ id: id('loc'), name, code: c, type, city, country, _count: { assets: 0 } }));

  const firstNames = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Aditya', 'Ishaan', 'Saanvi', 'Kabir', 'Myra', 'Reyansh', 'Anika', 'Arjun', 'Kiara', 'Vihaan', 'Sara', 'Dev', 'Aisha', 'Rohan', 'Tara', 'Nikhil'];
  const lastNames = ['Sharma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Gupta', 'Mehta', 'Rao', 'Kapoor', 'Singh'];
  const designations = ['Software Engineer', 'Senior Engineer', 'Project Manager', 'Analyst', 'Lead', 'Consultant', 'Director', 'Specialist'];
  const employees: Employee[] = Array.from({ length: 28 }).map((_, i) => {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const dept = pick(departments);
    return {
      id: id('emp'), employeeCode: `EMP-${1001 + i}`, name,
      email: `${name.toLowerCase().replace(/\s/g, '.')}.${i}@utthunga.com`,
      designation: pick(designations), department: { id: dept.id, name: dept.name },
      location: { id: pick(locations).id, name: pick(locations).name }, isActive: true,
    };
  });

  const statuses: AssetStatus[] = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'IN_MAINTENANCE', 'RESERVED', 'IN_TRANSIT'];
  const conditions: AssetCondition[] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR'];
  const models: Record<string, string[]> = {
    LAP: ['Latitude 7440', 'EliteBook 840', 'ThinkPad X1', 'MacBook Pro 14'],
    DSK: ['OptiPlex 7010', 'ProDesk 600', 'ThinkCentre M70'], MON: ['UltraSharp U2723', 'E24 G5', 'ThinkVision T24'],
    MOB: ['iPhone 15', 'Galaxy S24', 'Pixel 8'], NET: ['Catalyst 9200', 'Meraki MX68', 'Aironet 2800'],
    SRV: ['PowerEdge R750', 'ProLiant DL380', 'ThinkSystem SR650'], PRN: ['LaserJet Pro M404', 'EcoTank L3250'],
    FUR: ['Ergonomic Chair', 'Standing Desk', 'Storage Cabinet'], VEH: ['Tata Nexon EV', 'Toyota Innova'],
    LAB: ['Oscilloscope DSOX', 'Signal Generator', 'Thermal Chamber'],
  };
  const assets: Asset[] = Array.from({ length: 60 }).map(() => {
    const category = pick(categories);
    const vendor = pick(vendors);
    const location = pick(locations);
    const purchaseCost = rnd(8000, 220000);
    const ageMonths = rnd(1, 36);
    const annualDep = (purchaseCost * category.depreciationRate) / 100;
    const currentValue = Math.max(Math.round(purchaseCost * 0.1), Math.round(purchaseCost - (annualDep * ageMonths) / 12));
    const model = pick(models[category.code] ?? ['Standard']);
    category._count!.assets++;
    location._count!.assets++;
    return {
      id: id('ast'), assetCode: code('AST'), name: `${category.name.replace(/s$/, '')} — ${model}`,
      categoryId: category.id, category: { id: category.id, name: category.name, code: category.code, icon: category.icon },
      vendor: { id: vendor.id, vendorName: vendor.vendorName }, location: { id: location.id, name: location.name, city: location.city },
      serialNumber: `SN${Math.random().toString(36).slice(2, 10).toUpperCase()}`, manufacturer: vendor.vendorName, model,
      qrCode: Math.random().toString(36).slice(2), barcode: String(rnd(1e12, 9e12)),
      purchaseDate: iso(monthsAgo(ageMonths)), purchaseCost, currentValue,
      warrantyExpiry: iso(daysFromNow(rnd(-120, 400))), amcExpiry: iso(daysFromNow(rnd(-60, 365))),
      status: pick(statuses), condition: pick(conditions), assignedTo: null, createdAt: iso(monthsAgo(ageMonths)),
    };
  });

  // assign ~26 assets
  const assignments: Assignment[] = [];
  assets.slice(0, 26).forEach((a) => {
    const emp = pick(employees);
    a.status = 'ASSIGNED';
    a.assignedTo = { id: emp.id, name: emp.name, employeeCode: emp.employeeCode };
    assignments.push({
      id: id('asg'), status: 'ACTIVE', assignedDate: iso(monthsAgo(rnd(0, 10))),
      expectedReturnDate: iso(daysFromNow(rnd(30, 365))),
      asset: { id: a.id, name: a.name, assetCode: a.assetCode, status: a.status },
      employee: { id: emp.id, name: emp.name, employeeCode: emp.employeeCode },
    });
  });
  assets.slice(40, 46).forEach((a) => {
    const emp = pick(employees);
    assignments.push({
      id: id('asg'), status: 'RETURNED', assignedDate: iso(monthsAgo(rnd(8, 14))),
      actualReturnDate: iso(monthsAgo(rnd(1, 4))),
      asset: { id: a.id, name: a.name, assetCode: a.assetCode, status: a.status },
      employee: { id: emp.id, name: emp.name, employeeCode: emp.employeeCode },
    });
  });

  const mTypes = ['PREVENTIVE', 'CORRECTIVE', 'AMC', 'WARRANTY_CLAIM', 'INSPECTION'];
  const mStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'];
  const maintenance: MaintenanceRecord[] = Array.from({ length: 22 }).map(() => {
    const a = pick(assets);
    const status = pick(mStatuses);
    return {
      id: id('mnt'), title: pick(['Quarterly service', 'Screen repair', 'Battery replacement', 'AMC renewal', 'Annual inspection', 'OS re-imaging']),
      type: pick(mTypes), status, scheduledDate: iso(daysFromNow(rnd(-30, 45))),
      completedDate: status === 'COMPLETED' ? iso(monthsAgo(rnd(0, 3))) : undefined,
      cost: status === 'COMPLETED' ? rnd(500, 25000) : 0,
      asset: { id: a.id, name: a.name, assetCode: a.assetCode }, vendor: { id: pick(vendors).id, vendorName: pick(vendors).vendorName },
    };
  });

  const rStatuses = ['PENDING', 'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'];
  const requests: AssetRequest[] = Array.from({ length: 14 }).map(() => {
    const emp = pick(employees);
    return {
      id: id('req'), requestCode: code('REQ'), type: pick(['NEW_ASSET', 'REPLACEMENT', 'REPAIR']),
      status: pick(rStatuses), categoryName: pick(categories).name,
      justification: pick(['New joiner setup', 'Old device failing', 'Upgrade required for project', 'Damaged in transit', 'Additional workstation']),
      createdAt: iso(monthsAgo(rnd(0, 5))), employee: { id: emp.id, name: emp.name, employeeCode: emp.employeeCode },
    };
  });

  const roles: RoleSummary[] = [
    { id: id('rol'), name: 'Super Admin', description: 'Full platform access', isSystem: true, userCount: 1, permissions: ALL_PERMISSIONS },
    { id: id('rol'), name: 'Asset Manager', description: 'Manages asset lifecycle', isSystem: true, userCount: 1, permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith('admin')) },
    { id: id('rol'), name: 'Procurement Officer', description: 'Vendors & purchasing', isSystem: true, userCount: 1, permissions: ['dashboard:view', 'asset:view', 'vendor:view', 'vendor:manage', 'request:view', 'request:approve', 'report:view'] },
    { id: id('rol'), name: 'Auditor', description: 'Read-only compliance', isSystem: true, userCount: 1, permissions: ['dashboard:view', 'asset:view', 'audit:view', 'report:view', 'maintenance:view'] },
    { id: id('rol'), name: 'Employee', description: 'Self-service portal', isSystem: true, userCount: 1, permissions: ['dashboard:view', 'asset:view', 'request:create', 'request:view'] },
  ];

  const users: AppUser[] = [
    { name: 'System Administrator', email: 'admin@eams.io', role: 'Super Admin' },
    { name: 'Asha Menon', email: 'asset.manager@eams.io', role: 'Asset Manager' },
    { name: 'Rahul Verma', email: 'procurement@eams.io', role: 'Procurement Officer' },
    { name: 'Priya Nair', email: 'auditor@eams.io', role: 'Auditor' },
    { name: 'Kiran V', email: 'employee@eams.io', role: 'Employee' },
  ].map((u) => {
    const role = roles.find((r) => r.name === u.role)!;
    return {
      id: id('usr'), name: u.name, email: u.email, isActive: true, role: { id: role.id, name: role.name },
      department: { id: pick(departments).id, name: pick(departments).name },
      lastLoginAt: iso(monthsAgo(0)), createdAt: iso(monthsAgo(6)),
    };
  });

  const auditLogs: AuditLog[] = Array.from({ length: 40 }).map((_, i) => ({
    id: id('aud'), actorName: pick(users).name,
    action: pick(['CREATE', 'UPDATE', 'ASSIGN', 'LOGIN', 'RETURN', 'DELETE']),
    module: pick(['Assets', 'Procurement', 'Maintenance', 'Auth', 'Administration']),
    entity: pick(['Asset', 'Vendor', 'Employee', 'User', 'MaintenanceRecord']),
    summary: pick(['Asset registered in catalog', 'Vendor details updated', 'Asset assigned to employee', 'User signed in', 'Maintenance scheduled', 'Asset returned to inventory', 'Role permissions changed']),
    createdAt: iso(new Date(Date.now() - i * 5400000)),
  }));

  return { categories, vendors, departments, locations, employees, assets, assignments, maintenance, requests, users, roles, auditLogs };
};

export const newId = id;
