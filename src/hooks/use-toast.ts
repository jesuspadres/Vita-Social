import { useCallback } from "react";
import { create } from "zustand";

/* ─── Types ─── */

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

/* ─── Zustand Store ─── */

let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== toast.id),
      }));
    }, toast.duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));

/* ─── Hook ─── */

/**
 * Hook to trigger toasts from anywhere in the app.
 *
 * @example
 * const { toast, dismiss } = useToast();
 * toast("Profile saved!", "success");
 * toast("Something went wrong", "error");
 */
export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  const removeToast = useToastStore((s) => s.removeToast);

  const toast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      duration: number = 4000,
    ): string => {
      const id = `toast-${++toastCounter}-${Date.now()}`;
      addToast({ id, message, variant, duration });
      return id;
    },
    [addToast],
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast],
  );

  return { toast, dismiss } as const;
}
