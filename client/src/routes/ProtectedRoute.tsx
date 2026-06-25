import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') return <FullScreenLoader />;
  if (status === 'unauthenticated') return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
