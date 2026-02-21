import React, { useEffect, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { CheckCircle, XCircle, Info, X } from "lucide-react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { cn } from "@/lib/utils";

/* ─── Variant Config ─── */

const variantConfig = {
  success: {
    Icon: CheckCircle,
    bgClass: "bg-green-50",
    borderColor: "#38A16950",
    iconColor: "#38A169",
  },
  error: {
    Icon: XCircle,
    bgClass: "bg-red-50",
    borderColor: "#E53E3E50",
    iconColor: "#E53E3E",
  },
  info: {
    Icon: Info,
    bgClass: "bg-blue-50",
    borderColor: "#3182CE50",
    iconColor: "#3182CE",
  },
} as const;

export type ToastVariant = keyof typeof variantConfig;

/* ─── Types ─── */

export interface ToastProps {
  /** Unique id */
  id: string;
  /** Visual variant */
  variant?: ToastVariant;
  /** Toast message */
  message: string;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Called when the toast should be dismissed */
  onClose: () => void;
}

/* ─── Component ─── */

export function Toast({
  id,
  variant = "info",
  message,
  duration = 4000,
  onClose,
}: ToastProps) {
  const config = variantConfig[variant];
  const IconComponent = config.Icon;

  // Auto-dismiss
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      exiting={FadeOutUp.duration(250)}
      className={cn(
        "flex-row items-center gap-3 rounded-xl px-4 py-3",
        config.bgClass,
      )}
      style={{
        borderWidth: 1,
        borderColor: config.borderColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${variant} notification: ${message}`}
      accessibilityLiveRegion="polite"
    >
      <IconComponent size={20} color={config.iconColor} />

      <Text className="flex-1 text-sm font-medium text-gray-800">
        {message}
      </Text>

      <Pressable
        onPress={onClose}
        className="rounded-lg items-center justify-center"
        style={{ minWidth: 44, minHeight: 44 }}
        hitSlop={4}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
      >
        <X size={16} color="#6B7280" />
      </Pressable>
    </Animated.View>
  );
}

Toast.displayName = "Toast";
