import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { User } from "@/types/database";

// ---------------------------------------------------------------------------
// Auth Store
// Manages the current user session, profile data, and auth lifecycle.
// ---------------------------------------------------------------------------

interface AuthState {
  /** The currently authenticated Supabase user profile (from our users table). */
  user: User | null;

  /** The raw Supabase auth session (access token, refresh token, etc.). */
  session: Session | null;

  /** Whether the auth state is still being determined on initial load. */
  isLoading: boolean;

  /** Set the Supabase session after sign-in or refresh. */
  setSession: (session: Session | null) => void;

  /** Set the user profile loaded from the users table. */
  setUser: (user: User | null) => void;

  /** Mark auth as loading or resolved. */
  setIsLoading: (isLoading: boolean) => void;

  /** Full login -- sets session + user in one call. */
  login: (session: Session, user: User) => void;

  /** Full logout -- clears session + user. */
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setSession: (session) => set({ session }),

  setUser: (user) => set({ user }),

  setIsLoading: (isLoading) => set({ isLoading }),

  login: (session, user) =>
    set({
      session,
      user,
      isLoading: false,
    }),

  logout: () =>
    set({
      session: null,
      user: null,
      isLoading: false,
    }),
}));
