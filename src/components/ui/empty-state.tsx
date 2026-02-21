import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";

/* ─── Types ─── */

export interface EmptyStateProps {
  /** Lucide icon to display prominently */
  icon: LucideIcon;
  /** Heading text */
  title: string;
  /** Descriptive body text */
  description: string;
  /** Optional call-to-action button */
  action?: { label: string; onPress: () => void };
}

/* ─── Component ─── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(100)}
      className="items-center justify-center px-8 py-16"
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${description}`}
    >
      {/* Icon circle */}
      <View
        className="mb-5 h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(74, 144, 164, 0.1)" }}
      >
        <Icon size={36} color="#4A90A4" />
      </View>

      {/* Title */}
      <Text
        className="mb-2 text-lg font-semibold text-center"
        style={{ color: "#1A365D" }}
      >
        {title}
      </Text>

      {/* Description */}
      <Text className="mb-6 text-sm leading-relaxed text-gray-500 text-center max-w-[280px]">
        {description}
      </Text>

      {/* Optional CTA */}
      {action && (
        <Pressable
          onPress={action.onPress}
          className="rounded-full px-6 py-3 active:opacity-80 items-center justify-center"
          style={{ backgroundColor: "#1A365D", minHeight: 48 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text className="text-sm font-semibold text-white">
            {action.label}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

EmptyState.displayName = "EmptyState";
