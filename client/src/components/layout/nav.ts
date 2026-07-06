import {
  LayoutDashboard, Boxes, Tags, ArrowLeftRight, Users, Store, FileText,
  Wrench, ShieldCheck, BarChart3, Settings, Sparkles, LayoutGrid, CalendarCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
      { label: 'My Workspace', to: '/my-assets', icon: LayoutGrid, permission: 'asset:view' },
      { label: 'Smart Insights', to: '/insights', icon: Sparkles, permission: 'report:view' },
    ],
  },
  {
    title: 'Asset Management',
    items: [
      { label: 'Assets', to: '/assets', icon: Boxes, permission: 'asset:view' },
      { label: 'Categories', to: '/categories', icon: Tags, permission: 'asset:view' },
      { label: 'Assignments', to: '/assignments', icon: ArrowLeftRight, permission: 'asset:view' },
      { label: 'Reservations', to: '/reservations', icon: CalendarCheck, permission: 'asset:view' },
    ],
  },
  {
    title: 'Procurement & People',
    items: [
      { label: 'Employees', to: '/employees', icon: Users, permission: 'employee:view' },
      { label: 'Vendors', to: '/vendors', icon: Store, permission: 'vendor:view' },
      { label: 'Requests', to: '/requests', icon: FileText, permission: 'request:view' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Maintenance', to: '/maintenance', icon: Wrench, permission: 'maintenance:view' },
      { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'report:view' },
      { label: 'Audit & Compliance', to: '/audit', icon: ShieldCheck, permission: 'audit:view' },
    ],
  },
  {
    title: 'Administration',
    items: [{ label: 'Administration', to: '/administration', icon: Settings, permission: 'admin:users' }],
  },
];
