/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { ALL_PERMISSIONS, ROLE_PERMISSION_MAP, SYSTEM_ROLES } from '../src/models/permissions.js';

const prisma = new PrismaClient();

const hash = (p: string) => bcrypt.hash(p, 10);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const code = (p: string) => `${p}-${randomBytes(4).toString('hex').toUpperCase().slice(0, 6)}`;
const monthsAgo = (m: number) => new Date(new Date().setMonth(new Date().getMonth() - m));
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);

async function main() {
  console.log('🌱  Seeding EAMS database…');

  // ---- Reset (idempotent dev seed) ----
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.assetAssignment.deleteMany(),
    prisma.maintenanceRecord.deleteMany(),
    prisma.assetRequest.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.purchaseOrderItem.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.category.deleteMany(),
    prisma.rolePermission.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
    prisma.department.deleteMany(),
    prisma.location.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.organization.deleteMany(),
  ]);

  // ---- Organization ----
  const org = await prisma.organization.create({
    data: { name: 'Utthunga Technologies', code: 'UTTHUNGA', domain: 'utthunga.com' },
  });

  // ---- Permissions ----
  await prisma.permission.createMany({
    data: ALL_PERMISSIONS.map((p) => ({ key: p.key, module: p.module, description: p.description })),
  });
  const permissions = await prisma.permission.findMany();
  const permByKey = new Map(permissions.map((p) => [p.key, p.id]));

  // ---- Roles + role-permissions ----
  const roleByName = new Map<string, string>();
  for (const [name, keys] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await prisma.role.create({
      data: {
        organizationId: org.id,
        name,
        isSystem: true,
        description: `${name} role`,
        permissions: {
          create: keys
            .map((k) => permByKey.get(k))
            .filter((id): id is string => Boolean(id))
            .map((permissionId) => ({ permissionId })),
        },
      },
    });
    roleByName.set(name, role.id);
  }

  // ---- Departments & locations ----
  const deptData = [
    { name: 'Information Technology', code: 'IT', costCenter: 'CC-100' },
    { name: 'Engineering', code: 'ENG', costCenter: 'CC-200' },
    { name: 'Finance', code: 'FIN', costCenter: 'CC-300' },
    { name: 'Human Resources', code: 'HR', costCenter: 'CC-400' },
    { name: 'Operations', code: 'OPS', costCenter: 'CC-500' },
    { name: 'Sales & Marketing', code: 'SAL', costCenter: 'CC-600' },
  ];
  const departments = [];
  for (const d of deptData) departments.push(await prisma.department.create({ data: { ...d, organizationId: org.id } }));

  const locData = [
    { name: 'Bangalore HQ', code: 'BLR', type: 'HQ', city: 'Bangalore', country: 'India', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Pune Office', code: 'PUN', type: 'BRANCH', city: 'Pune', country: 'India', latitude: 18.5204, longitude: 73.8567 },
    { name: 'Central Warehouse', code: 'WH1', type: 'WAREHOUSE', city: 'Bangalore', country: 'India', latitude: 13.0, longitude: 77.6 },
    { name: 'Frankfurt Office', code: 'FRA', type: 'BRANCH', city: 'Frankfurt', country: 'Germany', latitude: 50.1109, longitude: 8.6821 },
  ];
  const locations = [];
  for (const l of locData) locations.push(await prisma.location.create({ data: { ...l, organizationId: org.id } }));

  // ---- Users ----
  const password = await hash('Admin@123');
  const userSpecs = [
    { name: 'System Administrator', email: 'admin@eams.io', role: SYSTEM_ROLES.SUPER_ADMIN },
    { name: 'Asha Menon', email: 'asset.manager@eams.io', role: SYSTEM_ROLES.ASSET_MANAGER },
    { name: 'Rahul Verma', email: 'procurement@eams.io', role: SYSTEM_ROLES.PROCUREMENT_OFFICER },
    { name: 'Priya Nair', email: 'auditor@eams.io', role: SYSTEM_ROLES.AUDITOR },
    { name: 'Kiran V', email: 'employee@eams.io', role: SYSTEM_ROLES.EMPLOYEE },
  ];
  for (const u of userSpecs) {
    await prisma.user.create({
      data: {
        organizationId: org.id, name: u.name, email: u.email, passwordHash: password,
        roleId: roleByName.get(u.role)!, departmentId: pick(departments).id, locationId: pick(locations).id,
        lastLoginAt: monthsAgo(0),
      },
    });
  }
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@eams.io' } });

  // ---- Categories ----
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
  const categories = [];
  for (const c of catData) categories.push(await prisma.category.create({ data: { ...c, organizationId: org.id } }));

  // ---- Vendors ----
  const vendorData = [
    { vendorName: 'Dell Technologies', code: 'DELL', contactPerson: 'Suresh K', email: 'sales@dell-partner.com', rating: 4.6, phone: '+91 80 1234 5678' },
    { vendorName: 'HP Enterprise', code: 'HPE', contactPerson: 'Megha R', email: 'orders@hpe-partner.com', rating: 4.4, phone: '+91 80 2345 6789' },
    { vendorName: 'Lenovo India', code: 'LEN', contactPerson: 'Arun P', email: 'b2b@lenovo-partner.com', rating: 4.2, phone: '+91 80 3456 7890' },
    { vendorName: 'Cisco Systems', code: 'CSC', contactPerson: 'Neha S', email: 'enterprise@cisco-partner.com', rating: 4.7, phone: '+91 80 4567 8901' },
    { vendorName: 'Apple Authorised', code: 'APL', contactPerson: 'Vikram J', email: 'corp@apple-reseller.com', rating: 4.8, phone: '+91 80 5678 9012' },
    { vendorName: 'Godrej Interio', code: 'GDR', contactPerson: 'Latha M', email: 'corp@godrej.com', rating: 4.0, phone: '+91 80 6789 0123' },
  ];
  const vendors = [];
  for (const v of vendorData) vendors.push(await prisma.vendor.create({ data: { ...v, organizationId: org.id } }));

  // ---- Employees ----
  const firstNames = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Aditya', 'Ishaan', 'Saanvi', 'Kabir', 'Myra', 'Reyansh', 'Anika', 'Arjun', 'Kiara', 'Vihaan', 'Sara', 'Dev', 'Aisha', 'Rohan', 'Tara', 'Nikhil'];
  const lastNames = ['Sharma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Gupta', 'Mehta', 'Rao', 'Kapoor', 'Singh'];
  const designations = ['Software Engineer', 'Senior Engineer', 'Project Manager', 'Analyst', 'Lead', 'Consultant', 'Director', 'Specialist'];
  const employees = [];
  for (let i = 0; i < 28; i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    employees.push(
      await prisma.employee.create({
        data: {
          organizationId: org.id,
          employeeCode: `EMP-${String(1001 + i)}`,
          name,
          email: `${name.toLowerCase().replace(/\s/g, '.')}.${i}@utthunga.com`,
          designation: pick(designations),
          departmentId: pick(departments).id,
          locationId: pick(locations).id,
        },
      }),
    );
  }

  // ---- Assets ----
  const conditions = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR'] as const;
  const statuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'IN_MAINTENANCE', 'RESERVED', 'IN_TRANSIT'] as const;
  const models: Record<string, string[]> = {
    LAP: ['Latitude 7440', 'EliteBook 840', 'ThinkPad X1', 'MacBook Pro 14'],
    DSK: ['OptiPlex 7010', 'ProDesk 600', 'ThinkCentre M70'],
    MON: ['UltraSharp U2723', 'E24 G5', 'ThinkVision T24'],
    MOB: ['iPhone 15', 'Galaxy S24', 'Pixel 8'],
    NET: ['Catalyst 9200', 'Meraki MX68', 'Aironet 2800'],
    SRV: ['PowerEdge R750', 'ProLiant DL380', 'ThinkSystem SR650'],
    PRN: ['LaserJet Pro M404', 'EcoTank L3250'],
    FUR: ['Ergonomic Chair', 'Standing Desk', 'Storage Cabinet'],
    VEH: ['Tata Nexon EV', 'Toyota Innova'],
    LAB: ['Oscilloscope DSOX', 'Signal Generator', 'Thermal Chamber'],
  };
  const assets = [];
  for (let i = 0; i < 60; i++) {
    const category = pick(categories);
    const vendor = pick(vendors);
    const purchaseCost = rnd(8000, 220000);
    const ageMonths = rnd(1, 36);
    const purchaseDate = monthsAgo(ageMonths);
    // straight-line depreciation
    const annualDep = (purchaseCost * category.depreciationRate) / 100;
    const currentValue = Math.max(purchaseCost * 0.1, Math.round(purchaseCost - (annualDep * ageMonths) / 12));
    const modelName = pick(models[category.code] ?? ['Standard Model']);
    assets.push(
      await prisma.asset.create({
        data: {
          organizationId: org.id,
          assetCode: code('AST'),
          name: `${category.name.replace(/s$/, '')} — ${modelName}`,
          categoryId: category.id,
          vendorId: vendor.id,
          locationId: pick(locations).id,
          serialNumber: `SN${randomBytes(5).toString('hex').toUpperCase()}`,
          manufacturer: vendor.vendorName,
          model: modelName,
          qrCode: randomBytes(12).toString('hex'),
          barcode: String(rnd(1000000000000, 9999999999999)),
          purchaseDate,
          purchaseCost,
          currentValue,
          salvageValue: Math.round(purchaseCost * 0.1),
          depreciationRate: category.depreciationRate,
          usefulLifeYears: category.usefulLifeYears,
          warrantyExpiry: daysFromNow(rnd(-120, 400)),
          amcExpiry: daysFromNow(rnd(-60, 365)),
          status: pick([...statuses]),
          condition: pick([...conditions]),
        },
      }),
    );
  }

  // ---- Assignments (assign ~40% of assets to employees) ----
  const assignable = assets.slice(0, 26);
  for (const asset of assignable) {
    const employee = pick(employees);
    await prisma.assetAssignment.create({
      data: {
        assetId: asset.id,
        employeeId: employee.id,
        assignedById: adminUser?.id,
        assignedDate: monthsAgo(rnd(0, 10)),
        expectedReturnDate: daysFromNow(rnd(30, 365)),
        status: 'ACTIVE',
        conditionOnAssign: asset.condition,
      },
    });
    await prisma.asset.update({ where: { id: asset.id }, data: { status: 'ASSIGNED', assignedToId: employee.id } });
  }
  // a few returned assignments for history
  for (const asset of assets.slice(40, 46)) {
    const employee = pick(employees);
    await prisma.assetAssignment.create({
      data: {
        assetId: asset.id, employeeId: employee.id, assignedById: adminUser?.id,
        assignedDate: monthsAgo(rnd(8, 14)), actualReturnDate: monthsAgo(rnd(1, 4)),
        status: 'RETURNED', conditionOnAssign: 'GOOD', conditionOnReturn: pick([...conditions]),
      },
    });
  }

  // ---- Maintenance ----
  const mTypes = ['PREVENTIVE', 'CORRECTIVE', 'AMC', 'WARRANTY_CLAIM', 'INSPECTION'] as const;
  const mStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'] as const;
  for (let i = 0; i < 22; i++) {
    const asset = pick(assets);
    const status = pick([...mStatuses]);
    await prisma.maintenanceRecord.create({
      data: {
        assetId: asset.id,
        vendorId: pick(vendors).id,
        type: pick([...mTypes]),
        status,
        title: `${pick(['Quarterly service', 'Screen repair', 'Battery replacement', 'AMC renewal', 'Annual inspection', 'OS re-imaging'])}`,
        description: 'Scheduled maintenance activity logged by the asset management team.',
        scheduledDate: daysFromNow(rnd(-30, 45)),
        completedDate: status === 'COMPLETED' ? monthsAgo(rnd(0, 3)) : null,
        nextDueDate: daysFromNow(rnd(60, 300)),
        cost: status === 'COMPLETED' ? rnd(500, 25000) : 0,
        performedBy: pick(vendorData).contactPerson,
      },
    });
  }

  // ---- Asset requests ----
  const rTypes = ['NEW_ASSET', 'REPLACEMENT', 'REPAIR'] as const;
  const rStatuses = ['PENDING', 'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'] as const;
  for (let i = 0; i < 14; i++) {
    await prisma.assetRequest.create({
      data: {
        requestCode: code('REQ'),
        employeeId: pick(employees).id,
        type: pick([...rTypes]),
        categoryName: pick(categories).name,
        justification: pick(['New joiner setup', 'Old device failing', 'Upgrade required for project', 'Damaged in transit', 'Additional workstation']),
        status: pick([...rStatuses]),
      },
    });
  }

  // ---- Seed an initial audit trail ----
  await prisma.auditLog.createMany({
    data: Array.from({ length: 10 }).map((_, i) => ({
      userId: adminUser?.id,
      actorName: 'System Administrator',
      action: pick(['CREATE', 'UPDATE', 'ASSIGN', 'LOGIN', 'RETURN']),
      module: pick(['Assets', 'Procurement', 'Maintenance', 'Auth']),
      entity: pick(['Asset', 'Vendor', 'Employee', 'User']),
      summary: pick([
        'Asset registered in catalog', 'Vendor details updated', 'Asset assigned to employee',
        'User signed in', 'Maintenance scheduled', 'Asset returned to inventory',
      ]),
      createdAt: new Date(Date.now() - i * 3600000),
    })),
  });

  console.log('✅  Seed complete.');
  console.log('   Org:        Utthunga Technologies');
  console.log(`   Assets:     ${assets.length}  ·  Employees: ${employees.length}  ·  Vendors: ${vendors.length}`);
  console.log('   Login:      admin@eams.io / Admin@123  (Super Admin)');
  console.log('   Also:       asset.manager@eams.io · procurement@eams.io · auditor@eams.io · employee@eams.io  (all Admin@123)');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
