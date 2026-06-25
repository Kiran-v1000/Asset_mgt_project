import { http } from './client';
import type { AuthUser } from '../utils/types';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    http.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => http.get<AuthUser>('/auth/me').then((r) => r.data),
  logout: () => http.post('/auth/logout'),
};
