/** Zustand store for client-side auth UI state (user, hydrated, setUser, clearAuth); not for server data cache. */

import { create } from "zustand";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: CurrentUser | null;
  hydrated: boolean;
  setUser: (user: CurrentUser | null) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user, hydrated: true }),
  clearAuth: () => set({ user: null, hydrated: true }),
  setHydrated: () => set({ hydrated: true }),
}));
