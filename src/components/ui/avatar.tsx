import React from "react";
import { View, Image, Text, type ViewStyle } from "react-native";
import { cn } from "@/lib/utils";

/* ─── Size Map ─── */

const sizeMap = {
  sm: { px: 32, text: "text-xs", dotSize: 8, badgeSize: 12 },
  md: { px: 48, text: "text-sm", dotSize: 10, badgeSize: 14 },
  lg: { px: 64, text: "text-lg", dotSize: 12, badgeSize: 16 },
  xl: { px: 96, text: "text-2xl", dotSize: 14, badgeSize: 20 },
} as const;

export type AvatarSize = keyof typeof sizeMap;

/* ─── Badge Variant ─── */

export type VerificationBadge = "none" | "green" | "blue" | "gold";

const badgeColors: Record<Exclude<VerificationBadge, "none">, string> = {
  green: "#38A169",
  blue: "#3182CE",
  gold: "#D4AF37",
};

/* ─── Types ─── */

export interface AvatarProps {
  /** Display size */
  size?: AvatarSize;
  /** Image URL -- if missing, initials fallback is rendered */
  src?: string | null;
  /** User display name -- used for initials fallback */
  name?: string;
  /** Show a green online indicator dot */
  online?: boolean;
  /** Verification badge overlay */
  badge?: VerificationBadge;
}

/* ─── Helpers ─── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Generate a deterministic background color from a name string. */
function getInitialsBg(name: string): string {
  const colors = [
    "#4A90A4",
    "#1A365D",
    "#38A169",
    "#D69E2E",
    "#3182CE",
    "#805AD5",
    "#DD6B20",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/* ─── Component ─── */

export function Avatar({
  size = "md",
  src,
  name = "",
  online = false,
  badge = "none",
}: AvatarProps) {
  const s = sizeMap[size];

  const containerStyle: ViewStyle = {
    width: s.px,
    height: s.px,
    borderRadius: s.px / 2,
    overflow: "hidden",
  };

  return (
    <View style={{ position: "relative", width: s.px, height: s.px }}>
      {/* Main circle */}
      <View
        className="items-center justify-center"
        style={[
          containerStyle,
          !src ? { backgroundColor: getInitialsBg(name || "?") } : undefined,
        ]}
      >
        {src ? (
          <Image
            source={{ uri: src }}
            style={{ width: s.px, height: s.px }}
            resizeMode="cover"
            accessibilityLabel={name || "Avatar"}
          />
        ) : (
          <Text className={cn("font-semibold text-white", s.text)}>
            {getInitials(name || "?")}
          </Text>
        )}
      </View>

      {/* Online indicator */}
      {online && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: s.dotSize,
            height: s.dotSize,
            borderRadius: s.dotSize / 2,
            backgroundColor: "#38A169",
            borderWidth: 2,
            borderColor: "#ffffff",
          }}
        />
      )}

      {/* Verification badge */}
      {badge !== "none" && (
        <View
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: s.badgeSize,
            height: s.badgeSize,
            borderRadius: s.badgeSize / 2,
            backgroundColor: badgeColors[badge],
            borderWidth: 2,
            borderColor: "#ffffff",
          }}
        />
      )}
    </View>
  );
}

Avatar.displayName = "Avatar";
