import { http } from './client';
import type { DashboardOverview, TrendPoint } from '../utils/types';

export const dashboardApi = {
  overview: () => http.get<DashboardOverview>('/dashboard/overview').then((r) => r.data),
  trend: () => http.get<TrendPoint[]>('/dashboard/trend').then((r) => r.data),
};
