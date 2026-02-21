import React, { type ReactNode } from "react";
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

/* ─── Variant Map ─── */

const variantClasses = {
  default: {
    container: "bg-gray-100",
    text: "text-gray-700",
  },
  success: {
    container: "bg-green-100",
    text: "text-green-700",
  },
  warning: {
    container: "bg-yellow-100",
    text: "text-yellow-700",
  },
  danger: {
    container: "bg-red-100",
    text: "text-red-700",
  },
  info: {
    container: "bg-blue-100",
    text: "text-blue-700",
  },
} as const;

export type BadgeVariant = keyof typeof variantClasses;

/* ─── Types ─── */

export interface BadgeProps {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Badge label content (string or number) */
  children?: ReactNode;
  /** Optional numeric count -- renders as a count pill */
  count?: number;
  /** Max count before showing truncation (default 99) */
  maxCount?: number;
  /** Additional className */
  className?: string;
}

/* ─── Component ─── */

export function Badge({
  variant = "default",
  children,
  count,
  maxCount = 99,
  className,
}: BadgeProps) {
  const v = variantClasses[variant];

  const displayCount =
    count !== undefined
      ? count > maxCount
        ? `${maxCount}+`
        : String(count)
      : null;

  const isCountOnly = displayCount !== null && !children;

  return (
    <View
      className={cn(
        "items-center justify-center rounded-full",
        v.container,
        isCountOnly ? "min-w-[20px] px-1.5 py-0.5" : "px-2 py-0.5",
        className,
      )}
    >
      <Text className={cn("text-xs font-semibold", v.text)}>
        {displayCount ?? children}
      </Text>
    </View>
  );
}

Badge.displayName = "Badge";
