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
  /** Absolute session start (ms). Used with SESSION_MAX_AGE on the client. */
  loggedInAt: number | null;
  /** Last user interaction (ms). Persisted so the 3h idle logout survives tab closes/reloads. */
  lastActivityAt: number | null;
  setAuth: (user: AuthUser) => void;
  touchActivity: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loggedInAt: null,
      lastActivityAt: null,
      setAuth: (user) =>
        set({
          user,
          token: user.token,
          loggedInAt: Date.now(),
          lastActivityAt: Date.now(),
        }),
      touchActivity: () => set({ lastActivityAt: Date.now() }),
      logout: () =>
        set({ user: null, token: null, loggedInAt: null, lastActivityAt: null }),
    }),
    { name: 'sartor-platform-auth' },
  ),
);
