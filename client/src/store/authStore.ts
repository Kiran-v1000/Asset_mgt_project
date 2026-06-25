import { create } from 'zustand';
import { authApi } from '../api/authApi';
import { tokenStore } from '../api/client';
import type { AuthUser } from '../utils/types';

type Status = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',

  login: async (email, password) => {
    set({ status: 'loading' });
    try {
      const { accessToken, user } = await authApi.login(email, password);
      tokenStore.set(accessToken);
      set({ user, status: 'authenticated' });
    } catch (err) {
      set({ status: 'unauthenticated' });
      throw err;
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    tokenStore.clear();
    set({ user: null, status: 'unauthenticated' });
  },

  bootstrap: async () => {
    if (!tokenStore.get()) {
      set({ status: 'unauthenticated' });
      return;
    }
    set({ status: 'loading' });
    try {
      const user = await authApi.me();
      set({ user, status: 'authenticated' });
    } catch {
      tokenStore.clear();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  hasPermission: (perm) => {
    const user = get().user;
    if (!user) return false;
    return user.permissions.includes(perm);
  },
}));
