/** Zustand store for client-side auth UI state (user, setUser, clearAuth); not for server data cache. */

import { create } from "zustand";

interface AuthState {
  user: unknown | null;
  setUser: (user: unknown) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearAuth: () => set({ user: null }),
}));
