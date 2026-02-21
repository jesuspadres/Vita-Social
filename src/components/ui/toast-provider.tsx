import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "@/hooks/use-toast";
import { Toast } from "@/components/ui/toast";

/**
 * Renders all active toasts from the Zustand toast store.
 * Place this once in a root layout or provider tree.
 *
 * @example
 * // In your root layout:
 * <ToastProvider />
 */
export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        zIndex: 9999,
      }}
      pointerEvents="box-none"
    >
      <View className="gap-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            variant={t.variant}
            message={t.message}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </View>
    </View>
  );
}

ToastProvider.displayName = "ToastProvider";
