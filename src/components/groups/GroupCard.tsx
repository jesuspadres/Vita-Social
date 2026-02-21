import React, { useCallback } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Users, Lock, Globe, EyeOff } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { HealthRing } from "@/components/ui/health-ring";
import { HEALTH_PERIOD_DAYS } from "@/lib/constants";
import type { MockGroup } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroupCardProps {
  /** The group data to render */
  group: MockGroup;
  /** Card layout variant */
  variant?: "list" | "grid";
  /** Tap handler for navigation */
  onPress?: (group: MockGroup) => void;
  /** Join / Request button handler */
  onJoin?: (group: MockGroup) => void;
}

// ---------------------------------------------------------------------------
// Privacy Config
// ---------------------------------------------------------------------------

const privacyConfig = {
  public: {
    label: "Public",
    Icon: Globe,
    buttonLabel: "Join",
    buttonBg: "#4A90A4",
  },
  private: {
    label: "Private",
    Icon: Lock,
    buttonLabel: "Request",
    buttonBg: "#1A365D",
  },
  secret: {
    label: "Secret",
    Icon: EyeOff,
    buttonLabel: "Invite Only",
    buttonBg: "#A0AEC0",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GroupCard({
  group,
  variant = "list",
  onPress,
  onJoin,
}: GroupCardProps) {
  const privacy = privacyConfig[group.privacy_tier];
  const daysElapsed = HEALTH_PERIOD_DAYS - group.health_days_remaining;

  // Press animation
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(variant === "list" ? 0.98 : 0.96, {
      duration: 100,
    });
  }, [scale, variant]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
  }, [scale]);

  // ── Grid Variant ──
  if (variant === "grid") {
    return (
      <Animated.View style={[styles.gridWrapper, animatedStyle]}>
        <Pressable
          onPress={() => onPress?.(group)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.gridCard}
        >
          {/* Cover Image */}
          <View style={styles.gridImageContainer}>
            <Image
              source={{ uri: group.cover_image }}
              style={styles.gridImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={StyleSheet.absoluteFill}
            />

            {/* Group name overlay */}
            <View style={styles.gridNameOverlay}>
              <Text style={styles.gridName} numberOfLines={2}>
                {group.name}
              </Text>
            </View>
          </View>

          {/* Bottom bar */}
          <View style={styles.gridBottom}>
            <View style={styles.gridMeta}>
              <Users size={14} color="#6B7280" />
              <Text style={styles.gridMemberCount}>{group.member_count}</Text>
              <Text style={styles.gridCategory} numberOfLines={1}>
                {group.category}
              </Text>
            </View>

            {!group.is_member && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onJoin?.(group);
                }}
                disabled={group.privacy_tier === "secret"}
                style={[
                  styles.joinButton,
                  {
                    backgroundColor: privacy.buttonBg,
                    opacity: group.privacy_tier === "secret" ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={styles.joinButtonText}>
                  {privacy.buttonLabel}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── List Variant ──
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => onPress?.(group)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.listCard}
      >
        {/* Cover thumbnail */}
        <View style={styles.listImageContainer}>
          <Image
            source={{ uri: group.cover_image }}
            style={styles.listImage}
            resizeMode="cover"
          />
        </View>

        {/* Info */}
        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={1}>
            {group.name}
          </Text>

          {/* Privacy + Category row */}
          <View style={styles.listPrivacyRow}>
            <privacy.Icon size={12} color="#6B7280" />
            <Text style={styles.listPrivacyLabel}>{privacy.label}</Text>
            <View style={styles.listDot} />
            <Text style={styles.listCategory}>{group.category}</Text>
          </View>

          {/* Member count */}
          <View style={styles.listMemberRow}>
            <Users size={12} color="#6B7280" />
            <Text style={styles.listMemberCount}>
              {group.member_count} member{group.member_count !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Health Ring (only for joined groups) */}
        {group.is_member && (
          <View style={styles.listHealthRing}>
            <HealthRing
              daysElapsed={Math.max(0, daysElapsed)}
              size={48}
              strokeWidth={3}
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

GroupCard.displayName = "GroupCard";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // ── Grid ──
  gridWrapper: {
    flex: 1,
    padding: 4,
  },
  gridCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridImageContainer: {
    height: 120,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridNameOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  gridName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  gridBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  gridMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  gridMemberCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
  },
  gridCategory: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  joinButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minHeight: 28,
    justifyContent: "center",
  },
  joinButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },

  // ── List ──
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    minHeight: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  listImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
  },
  listImage: {
    width: "100%",
    height: "100%",
  },
  listInfo: {
    flex: 1,
    gap: 3,
  },
  listName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  listPrivacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listPrivacyLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
  },
  listDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
  },
  listCategory: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  listMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  listMemberCount: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  listHealthRing: {
    marginLeft: 4,
  },
});
