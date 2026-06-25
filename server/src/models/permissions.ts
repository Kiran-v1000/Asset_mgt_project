/**
 * Central permission catalog. Permissions are granular `module:action` keys.
 * Roles are mapped to permission sets here and seeded into the database.
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: { key: 'dashboard:view', module: 'Dashboard', description: 'View dashboards & KPIs' },

  // Assets
  ASSET_VIEW: { key: 'asset:view', module: 'Assets', description: 'View assets' },
  ASSET_CREATE: { key: 'asset:create', module: 'Assets', description: 'Register assets' },
  ASSET_UPDATE: { key: 'asset:update', module: 'Assets', description: 'Edit assets' },
  ASSET_DELETE: { key: 'asset:delete', module: 'Assets', description: 'Delete/dispose assets' },
  ASSET_ASSIGN: { key: 'asset:assign', module: 'Assets', description: 'Assign & return assets' },

  // Catalog
  CATEGORY_MANAGE: { key: 'category:manage', module: 'Assets', description: 'Manage categories' },

  // Employees
  EMPLOYEE_VIEW: { key: 'employee:view', module: 'Employees', description: 'View employees' },
  EMPLOYEE_MANAGE: { key: 'employee:manage', module: 'Employees', description: 'Manage employees' },

  // Procurement
  VENDOR_VIEW: { key: 'vendor:view', module: 'Procurement', description: 'View vendors' },
  VENDOR_MANAGE: { key: 'vendor:manage', module: 'Procurement', description: 'Manage vendors' },
  REQUEST_VIEW: { key: 'request:view', module: 'Procurement', description: 'View asset requests' },
  REQUEST_CREATE: { key: 'request:create', module: 'Procurement', description: 'Raise asset requests' },
  REQUEST_APPROVE: { key: 'request:approve', module: 'Procurement', description: 'Approve/reject requests' },

  // Maintenance
  MAINTENANCE_VIEW: { key: 'maintenance:view', module: 'Maintenance', description: 'View maintenance' },
  MAINTENANCE_MANAGE: { key: 'maintenance:manage', module: 'Maintenance', description: 'Manage maintenance' },

  // Audit & compliance
  AUDIT_VIEW: { key: 'audit:view', module: 'Audit', description: 'View audit logs' },

  // Reports
  REPORT_VIEW: { key: 'report:view', module: 'Reports', description: 'View reports & analytics' },

  // Administration
  ADMIN_USERS: { key: 'admin:users', module: 'Administration', description: 'Manage users' },
  ADMIN_ROLES: { key: 'admin:roles', module: 'Administration', description: 'Manage roles & permissions' },
  ADMIN_SETTINGS: { key: 'admin:settings', module: 'Administration', description: 'Manage org settings' },
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]['key'];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/** System roles seeded for every organization. */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ASSET_MANAGER: 'Asset Manager',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  AUDITOR: 'Auditor',
  EMPLOYEE: 'Employee',
} as const;

const keys = (...perms: { key: string }[]) => perms.map((p) => p.key);

export const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: ALL_PERMISSIONS.map((p) => p.key),
  [SYSTEM_ROLES.ASSET_MANAGER]: keys(
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ASSET_VIEW, PERMISSIONS.ASSET_CREATE, PERMISSIONS.ASSET_UPDATE,
    PERMISSIONS.ASSET_DELETE, PERMISSIONS.ASSET_ASSIGN, PERMISSIONS.CATEGORY_MANAGE,
    PERMISSIONS.EMPLOYEE_VIEW,
    PERMISSIONS.MAINTENANCE_VIEW, PERMISSIONS.MAINTENANCE_MANAGE,
    PERMISSIONS.VENDOR_VIEW, PERMISSIONS.REQUEST_VIEW, PERMISSIONS.REQUEST_APPROVE,
    PERMISSIONS.REPORT_VIEW, PERMISSIONS.AUDIT_VIEW,
  ),
  [SYSTEM_ROLES.PROCUREMENT_OFFICER]: keys(
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.VENDOR_VIEW, PERMISSIONS.VENDOR_MANAGE,
    PERMISSIONS.REQUEST_VIEW, PERMISSIONS.REQUEST_APPROVE,
    PERMISSIONS.REPORT_VIEW,
  ),
  [SYSTEM_ROLES.AUDITOR]: keys(
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.AUDIT_VIEW, PERMISSIONS.REPORT_VIEW, PERMISSIONS.MAINTENANCE_VIEW,
  ),
  [SYSTEM_ROLES.EMPLOYEE]: keys(
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.REQUEST_CREATE, PERMISSIONS.REQUEST_VIEW,
  ),
};
