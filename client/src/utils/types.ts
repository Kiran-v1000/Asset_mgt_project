export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PageMeta;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: { id: string; name: string };
  organizationId: string;
  permissions: string[];
  employeeId?: string;
  employeeName?: string;
}

export interface Reservation {
  id: string;
  status: 'RESERVED' | 'CANCELLED' | 'FULFILLED';
  reservedForDate?: string;
  notes?: string;
  createdAt: string;
  asset?: { id: string; name: string; assetCode: string };
  employee?: { id: string; name: string; employeeCode: string };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  link?: string;
  createdAt: string;
}

export type AssetStatus =
  | 'AVAILABLE' | 'ASSIGNED' | 'IN_MAINTENANCE' | 'IN_TRANSIT'
  | 'RESERVED' | 'RETIRED' | 'DISPOSED' | 'LOST' | 'DAMAGED';

export type AssetCondition = 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: { id: string; name: string; code: string; icon?: string };
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  qrCode?: string;
  barcode?: string;
  purchaseDate?: string;
  purchaseCost: number;
  currentValue: number;
  depreciationRate?: number;
  usefulLifeYears?: number;
  warrantyExpiry?: string;
  amcExpiry?: string;
  status: AssetStatus;
  condition: AssetCondition;
  location?: { id: string; name: string; city?: string };
  assignedTo?: { id: string; name: string; employeeCode: string; avatarUrl?: string } | null;
  vendor?: { id: string; vendorName: string };
  createdAt: string;
}

export interface DashboardOverview {
  kpis: {
    totalAssets: number;
    totalValue: number;
    purchaseValue: number;
    assigned: number;
    available: number;
    inMaintenance: number;
    utilizationRate: number;
    activeAssignments: number;
    openMaintenance: number;
    employees: number;
    vendors: number;
  };
  statusBreakdown: { status: AssetStatus; count: number }[];
  categoryBreakdown: { name: string; count: number }[];
  expiringWarranties: { id: string; name: string; assetCode: string; warrantyExpiry: string }[];
  recentActivity: AuditLog[];
}

export interface TrendPoint { month: string; count: number; spend: number }

export interface AuditLog {
  id: string;
  actorName?: string;
  action: string;
  module: string;
  entity: string;
  summary?: string;
  createdAt: string;
}

export interface Employee {
  id: string; employeeCode: string; name: string; email: string;
  designation?: string; phone?: string;
  department?: { id: string; name: string }; location?: { id: string; name: string };
  isActive: boolean;
}

export interface Vendor {
  id: string; vendorName: string; code: string; contactPerson?: string;
  email?: string; phone?: string; rating?: number; isActive: boolean;
}

export interface Category {
  id: string; name: string; code: string; icon?: string;
  depreciationRate: number; usefulLifeYears: number;
  _count?: { assets: number };
}

export interface Assignment {
  id: string; status: string; assignedDate: string;
  expectedReturnDate?: string; actualReturnDate?: string;
  asset?: { id: string; name: string; assetCode: string; status: string };
  employee?: { id: string; name: string; employeeCode: string; avatarUrl?: string };
}

export interface MaintenanceRecord {
  id: string; title: string; type: string; status: string;
  scheduledDate?: string; completedDate?: string; cost: number;
  asset?: { id: string; name: string; assetCode: string };
  vendor?: { id: string; vendorName: string };
}

export interface AssetRequest {
  id: string; requestCode: string; type: string; status: string;
  categoryName?: string; justification?: string; createdAt: string;
  employee?: { id: string; name: string; employeeCode: string };
}

export interface AppUser {
  id: string; name: string; email: string; isActive: boolean;
  role?: { id: string; name: string }; department?: { id: string; name: string };
  lastLoginAt?: string; createdAt: string;
}

export interface RoleSummary {
  id: string; name: string; description?: string; isSystem: boolean;
  userCount: number; permissions: string[];
}

export interface Location {
  id: string; name: string; code: string; type?: string; city?: string; country?: string;
  _count?: { assets: number };
}

export interface Department {
  id: string; name: string; code: string; costCenter?: string;
  _count?: { employees: number };
}
