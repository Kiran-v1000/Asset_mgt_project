import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return <AppRoutes />;
}
