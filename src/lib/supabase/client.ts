import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { Database } from "@/types/database";

/* ─── SecureStore Adapter ─── */

const ExpoSecureStoreAdapter = {
  getItem: (key: string): string | null => {
    return SecureStore.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    SecureStore.setItem(key, value);
  },
  removeItem: (key: string): void => {
    SecureStore.deleteItemAsync(key);
  },
};

/* ─── Environment Variables ─── */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/* ─── Client ─── */

/**
 * Creates a typed Supabase client for React Native with SecureStore
 * for persisting auth tokens.
 *
 * Returns null when env vars are not configured (prototype mode).
 */
function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createClient();
