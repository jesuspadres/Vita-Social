import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { ArrowLeft, Users, Calendar, Flame, Info } from "lucide-react-native";
import { HealthRing } from "@/components/ui/health-ring";
import { COLORS, getHealthRingColor } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_OVERALL_DAYS = 12;

const MOCK_GROUP_HEALTH = [
  {
    id: "grp-1",
    name: "Austin Climbers",
    lastAttendedDays: 12,
    memberCount: 24,
  },
  {
    id: "grp-2",
    name: "Vinyl Collectors ATX",
    lastAttendedDays: 28,
    memberCount: 18,
  },
  {
    id: "grp-3",
    name: "Design + Coffee",
    lastAttendedDays: 5,
    memberCount: 31,
  },
];

const MOCK_STATS = {
  groupsActive: 3,
  eventsAttended: 8,
  currentStreak: 4,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HealthRingDetailPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBox({ label, value, Icon }: { label: string; value: number; Icon: typeof Users }) {
  return (
    <View style={s.statBox}>
      <Icon size={20} color={COLORS.secondary} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function GroupHealthItem({
  name,
  lastAttendedDays,
}: {
  name: string;
  lastAttendedDays: number;
}) {
  const healthInfo = getHealthRingColor(lastAttendedDays);
  const statusColor =
    healthInfo.color === "green"
      ? COLORS.success
      : healthInfo.color === "yellow"
        ? COLORS.warning
        : healthInfo.color === "orange"
          ? "#DD6B20"
          : healthInfo.color === "red"
            ? COLORS.danger
            : "#A0AEC0";

  return (
    <View style={s.groupItem}>
      <HealthRing daysElapsed={lastAttendedDays} size={32} strokeWidth={2.5} />
      <View style={s.groupItemInfo}>
        <Text style={s.groupItemName}>{name}</Text>
        <Text style={s.groupItemSub}>
          Last attended: {lastAttendedDays} days ago
        </Text>
      </View>
      <View style={[s.statusBadge, { backgroundColor: statusColor + "18" }]}>
        <Text style={[s.statusBadgeText, { color: statusColor }]}>
          {healthInfo.label}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HealthRingDetailPage({ onClose }: HealthRingDetailPageProps) {
  const insets = useSafeAreaInsets();

  // Slide-in animation
  const translateX = useSharedValue(SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezierFn(0.22, 1, 0.36, 1),
    });
  }, [translateX]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleClose = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
    setTimeout(onClose, 260);
  }, [translateX, onClose]);

  // Swipe-right-to-go-back gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (
        event.translationX > SWIPE_THRESHOLD ||
        event.velocityX > VELOCITY_THRESHOLD
      ) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[s.overlay, slideStyle]}>
        <View style={[s.root, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={s.header}>
            <Pressable
              onPress={handleClose}
              style={s.backBtn}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <Text style={s.headerTitle}>Health Ring</Text>
            <View style={s.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 40 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Ring */}
            <View style={s.heroSection}>
              <HealthRing
                daysElapsed={MOCK_OVERALL_DAYS}
                size={120}
                strokeWidth={6}
              />
              <Text style={s.heroLabel}>Overall Health</Text>
              <Text style={s.heroDesc}>
                Based on your most recent check-in across all groups
              </Text>
            </View>

            {/* Stats Row */}
            <View style={s.statsRow}>
              <StatBox
                label="Groups Active"
                value={MOCK_STATS.groupsActive}
                Icon={Users}
              />
              <StatBox
                label="Events Attended"
                value={MOCK_STATS.eventsAttended}
                Icon={Calendar}
              />
              <StatBox
                label="Current Streak"
                value={MOCK_STATS.currentStreak}
                Icon={Flame}
              />
            </View>

            {/* Group Breakdown */}
            <SectionHeader title="YOUR GROUPS" />
            <View style={s.sectionGroup}>
              {MOCK_GROUP_HEALTH.map((group, index) => (
                <React.Fragment key={group.id}>
                  <GroupHealthItem
                    name={group.name}
                    lastAttendedDays={group.lastAttendedDays}
                  />
                  {index < MOCK_GROUP_HEALTH.length - 1 && (
                    <View style={s.itemDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Tip Card */}
            <View style={s.tipCard}>
              <View style={s.tipIconCircle}>
                <Info size={18} color={COLORS.secondary} />
              </View>
              <View style={s.tipContent}>
                <Text style={s.tipTitle}>Stay active!</Text>
                <Text style={s.tipText}>
                  Attend at least one event per group every 30 days to keep your
                  ring green. Your health ring reflects how engaged you are with
                  your communities.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

HealthRingDetailPage.displayName = "HealthRingDetailPage";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  root: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: {
    width: 44,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  // Hero section
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginTop: 16,
  },
  heroDesc: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 32,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2D3D",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    color: "#718096",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A0AEC0",
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: "Inter_700Bold",
  },

  // Section group
  sectionGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 44,
  },

  // Group health item
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  groupItemInfo: {
    flex: 1,
  },
  groupItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  groupItemSub: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  // Tip card
  tipCard: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(74,144,164,0.08)",
    borderWidth: 1,
    borderColor: "rgba(74,144,164,0.15)",
  },
  tipIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(74,144,164,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
