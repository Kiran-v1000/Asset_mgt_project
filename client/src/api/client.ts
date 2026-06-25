import axios from 'axios';
import { env } from '../config/env';
import { mockHandle } from './mock/handler';
import type { ApiEnvelope } from '../utils/types';

const TOKEN_KEY = 'eams.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const axiosInstance = axios.create({ baseURL: env.apiUrl, timeout: 20000 });

axiosInstance.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && !location.pathname.startsWith('/login')) {
      tokenStore.clear();
      location.assign('/login');
    }
    return Promise.reject(error);
  },
);

type Params = Record<string, unknown>;

/**
 * Unified transport. Every API module calls these four methods; the layer below
 * is either the real backend (axios) or the in-memory mock, chosen by env flag.
 */
export const http = {
  async get<T>(url: string, params?: Params): Promise<ApiEnvelope<T>> {
    if (env.useMock) return mockHandle<T>({ method: 'get', url, params });
    return (await axiosInstance.get<ApiEnvelope<T>>(url, { params })).data;
  },
  async post<T>(url: string, data?: Params): Promise<ApiEnvelope<T>> {
    if (env.useMock) return mockHandle<T>({ method: 'post', url, data });
    return (await axiosInstance.post<ApiEnvelope<T>>(url, data)).data;
  },
  async patch<T>(url: string, data?: Params): Promise<ApiEnvelope<T>> {
    if (env.useMock) return mockHandle<T>({ method: 'patch', url, data });
    return (await axiosInstance.patch<ApiEnvelope<T>>(url, data)).data;
  },
  async del<T>(url: string): Promise<ApiEnvelope<T>> {
    if (env.useMock) return mockHandle<T>({ method: 'delete', url });
    return (await axiosInstance.delete<ApiEnvelope<T>>(url)).data;
  },
};
