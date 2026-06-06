import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoleId } from '../types';

export interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  token: string;
  accountType: string;
  platformRole?: RoleId;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user) => set({ user, token: user.token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'sartor-platform-auth' },
  ),
);
