import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Avatar, type VerificationBadge } from "@/components/ui/avatar";
import { getHealthRingColor } from "@/lib/constants";
import type { MockConversation } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationRowProps {
  conversation: MockConversation;
  onPress: (conversation: MockConversation) => void;
  /** Index for staggered entrance animation */
  index?: number;
  /** Optional: days since last check-in. When provided, shows a thin health ring around the avatar. */
  healthDays?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map health ring color name to hex value */
const HEALTH_COLOR_HEX: Record<string, string> = {
  green: "#38A169",
  yellow: "#D69E2E",
  orange: "#DD6B20",
  red: "#E53E3E",
  gray: "#A0AEC0",
};

function getHealthHexColor(days: number): string {
  const threshold = getHealthRingColor(days);
  return HEALTH_COLOR_HEX[threshold.color] ?? "#A0AEC0";
}

function mapVerificationBadge(
  level: "none" | "photo" | "id",
): VerificationBadge {
  switch (level) {
    case "id":
      return "blue";
    case "photo":
      return "green";
    default:
      return "none";
  }
}

function formatRelativeTime(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConversationRow({
  conversation,
  onPress,
  index = 0,
  healthDays,
}: ConversationRowProps) {
  const { user } = conversation;
  const hasUnread = conversation.unread_count > 0;

  // Health ring dimensions (avatar md = 48px, ring adds 2px stroke + 2px padding each side)
  const avatarSize = 48;
  const ringPadding = 3; // gap between avatar and ring
  const ringStrokeWidth = 2;
  const ringOuterSize = avatarSize + (ringPadding + ringStrokeWidth) * 2;
  const ringRadius = (ringOuterSize - ringStrokeWidth) / 2;
  const ringCenter = ringOuterSize / 2;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 40)
        .duration(300)
        .springify()
        .damping(18)}
    >
      <Pressable
        onPress={() => onPress(conversation)}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.containerPressed,
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${user.first_name}, last message: ${conversation.last_message}, ${formatRelativeTime(conversation.last_message_at)}${hasUnread ? `, ${conversation.unread_count} unread message${conversation.unread_count === 1 ? "" : "s"}` : ""}`}
      >
        {/* Avatar with optional health ring */}
        {healthDays != null ? (
          <View
            style={{
              width: ringOuterSize,
              height: ringOuterSize,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* SVG health ring */}
            <Svg
              width={ringOuterSize}
              height={ringOuterSize}
              style={{ position: "absolute" }}
            >
              <Circle
                cx={ringCenter}
                cy={ringCenter}
                r={ringRadius}
                fill="none"
                stroke={getHealthHexColor(healthDays)}
                strokeWidth={ringStrokeWidth}
              />
            </Svg>
            {/* Avatar centered inside ring */}
            <Avatar
              size="md"
              src={user.avatar_url}
              name={user.first_name}
              online={user.online}
              badge={mapVerificationBadge(user.verification_level)}
            />
          </View>
        ) : (
          <Avatar
            size="md"
            src={user.avatar_url}
            name={user.first_name}
            online={user.online}
            badge={mapVerificationBadge(user.verification_level)}
          />
        )}

        {/* Middle: Name + Preview */}
        <View style={styles.middle}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, hasUnread && styles.nameUnread]}
              numberOfLines={1}
            >
              {user.first_name}
            </Text>
            <Text
              style={[
                styles.timestamp,
                hasUnread && styles.timestampUnread,
              ]}
            >
              {formatRelativeTime(conversation.last_message_at)}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text
              style={[
                styles.preview,
                hasUnread && styles.previewUnread,
              ]}
              numberOfLines={1}
            >
              {conversation.last_message}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {conversation.unread_count > 99
                    ? "99+"
                    : conversation.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

ConversationRow.displayName = "ConversationRow";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 14,
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(226, 232, 240, 0.5)",
  },
  containerPressed: {
    backgroundColor: "#F7FAFC",
  },
  middle: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A365D",
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  nameUnread: {
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  timestamp: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
  timestampUnread: {
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  preview: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  previewUnread: {
    color: "#374151",
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
});
