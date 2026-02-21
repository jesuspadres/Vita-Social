import type { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui/toast-provider";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Application-wide providers wrapper.
 *
 * Wraps the app in:
 * - GestureHandlerRootView (required for react-native-gesture-handler)
 * - SafeAreaProvider (required for react-native-safe-area-context)
 * - ToastProvider (global toast notifications)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {children}
        <ToastProvider />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
