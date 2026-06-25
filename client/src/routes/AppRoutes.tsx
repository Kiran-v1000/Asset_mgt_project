import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';

const Login = lazy(() => import('../pages/Login/LoginPage'));
const Dashboard = lazy(() => import('../pages/Dashboard/DashboardPage'));
const Assets = lazy(() => import('../pages/Assets/AssetsPage'));
const Categories = lazy(() => import('../pages/Categories/CategoriesPage'));
const Assignments = lazy(() => import('../pages/Assignments/AssignmentsPage'));
const Employees = lazy(() => import('../pages/Employees/EmployeesPage'));
const Vendors = lazy(() => import('../pages/Vendors/VendorsPage'));
const Requests = lazy(() => import('../pages/Requests/RequestsPage'));
const Maintenance = lazy(() => import('../pages/Maintenance/MaintenancePage'));
const Reports = lazy(() => import('../pages/Reports/ReportsPage'));
const Audit = lazy(() => import('../pages/Audit/AuditPage'));
const Administration = lazy(() => import('../pages/Administration/AdministrationPage'));
const NotFound = lazy(() => import('../pages/NotFound'));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/administration" element={<Administration />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
