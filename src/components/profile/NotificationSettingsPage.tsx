import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
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
import {
  ArrowLeft,
  Bell,
  Heart,
  MessageSquare,
  ThumbsUp,
  Users,
  Activity,
  Calendar,
  MapPin,
  Moon,
  ChevronRight,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export interface NotificationSettingsPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

// ---------------------------------------------------------------------------
// Menu Item
// ---------------------------------------------------------------------------

function MenuItem({
  Icon,
  label,
  value,
  onPress,
  danger,
  showChevron = true,
  disabled,
}: {
  Icon?: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.menuItem, disabled && { opacity: 0.5 }]}
    >
      {Icon && (
        <Icon
          size={18}
          color={danger ? COLORS.danger : "#718096"}
          strokeWidth={1.75}
        />
      )}
      <View style={s.menuItemTextContainer}>
        <Text
          style={[s.menuItemLabel, danger && { color: COLORS.danger }]}
        >
          {label}
        </Text>
        {value && <Text style={s.menuItemValue}>{value}</Text>}
      </View>
      {showChevron && !danger && (
        <ChevronRight size={16} color="#CBD5E0" />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Toggle Item
// ---------------------------------------------------------------------------

function ToggleItem({
  Icon,
  label,
  helpText,
  enabled,
  onToggle,
  disabled,
}: {
  Icon?: LucideIcon;
  label: string;
  helpText?: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={[s.toggleItem, disabled && { opacity: 0.5 }]}>
      {Icon && <Icon size={18} color="#718096" strokeWidth={1.75} />}
      <View style={s.toggleTextContainer}>
        <Text style={s.toggleLabel}>{label}</Text>
        {helpText && (
          <Text style={s.toggleHelpText}>{helpText}</Text>
        )}
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#E2E8F0", true: COLORS.secondary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E2E8F0"
        disabled={disabled}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Quiet Hours Time Pill
// ---------------------------------------------------------------------------

function QuietHoursTimeRow({
  label,
  value,
  disabled,
}: {
  label: string;
  value: string;
  disabled?: boolean;
}) {
  return (
    <View style={[s.quietHoursRow, disabled && { opacity: 0.5 }]}>
      <Text style={s.quietHoursLabel}>{label}</Text>
      <View style={s.timePill}>
        <Text style={s.timePillText}>{value}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NotificationSettingsPage({
  onClose,
}: NotificationSettingsPageProps) {
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

  // General
  const [pushEnabled, setPushEnabled] = useState(true);

  // Connections
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [likeAlerts, setLikeAlerts] = useState(true);

  // Groups
  const [groupUpdates, setGroupUpdates] = useState(true);
  const [healthRingWarnings, setHealthRingWarnings] = useState(true);

  // Events
  const [eventReminders, setEventReminders] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(true);

  // Quiet Hours
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  // Whether sub-toggles are disabled
  const subDisabled = !pushEnabled;

  return (
    <GestureDetector gesture={panGesture}>
    <Animated.View style={[s.overlay, slideStyle]}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable
            onPress={handleClose}
            style={s.backBtn}
            hitSlop={8}
          >
            <ArrowLeft size={22} color="#111827" />
          </Pressable>
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── General ── */}
          <SectionHeader title="GENERAL" />
          <View style={s.sectionGroup}>
            <ToggleItem
              Icon={Bell}
              label="Push Notifications"
              helpText="Receive notifications on your device. Turn off to silence everything."
              enabled={pushEnabled}
              onToggle={() => setPushEnabled((p) => !p)}
            />
          </View>

          {/* ── Connections ── */}
          <SectionHeader title="CONNECTIONS" />
          <View style={[s.sectionGroup, subDisabled && s.sectionGroupDisabled]}>
            <ToggleItem
              Icon={Heart}
              label="Match Alerts"
              enabled={matchAlerts}
              onToggle={() => setMatchAlerts((p) => !p)}
              disabled={subDisabled}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={MessageSquare}
              label="Message Alerts"
              enabled={messageAlerts}
              onToggle={() => setMessageAlerts((p) => !p)}
              disabled={subDisabled}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={ThumbsUp}
              label="Like Alerts"
              enabled={likeAlerts}
              onToggle={() => setLikeAlerts((p) => !p)}
              disabled={subDisabled}
            />
          </View>

          {/* ── Groups ── */}
          <SectionHeader title="GROUPS" />
          <View style={[s.sectionGroup, subDisabled && s.sectionGroupDisabled]}>
            <ToggleItem
              Icon={Users}
              label="Group Updates"
              enabled={groupUpdates}
              onToggle={() => setGroupUpdates((p) => !p)}
              disabled={subDisabled}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={Activity}
              label="Health Ring Warnings"
              enabled={healthRingWarnings}
              onToggle={() => setHealthRingWarnings((p) => !p)}
              disabled={subDisabled}
            />
          </View>

          {/* ── Events ── */}
          <SectionHeader title="EVENTS" />
          <View style={[s.sectionGroup, subDisabled && s.sectionGroupDisabled]}>
            <ToggleItem
              Icon={Calendar}
              label="Event Reminders"
              enabled={eventReminders}
              onToggle={() => setEventReminders((p) => !p)}
              disabled={subDisabled}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={MapPin}
              label="Check-in Reminders"
              enabled={checkInReminders}
              onToggle={() => setCheckInReminders((p) => !p)}
              disabled={subDisabled}
            />
          </View>

          {/* ── Quiet Hours ── */}
          <SectionHeader title="QUIET HOURS" />
          <View style={[s.sectionGroup, subDisabled && s.sectionGroupDisabled]}>
            <ToggleItem
              Icon={Moon}
              label="Enable Quiet Hours"
              helpText="Notifications will be silenced during quiet hours"
              enabled={quietHoursEnabled}
              onToggle={() => setQuietHoursEnabled((p) => !p)}
              disabled={subDisabled}
            />
            <View style={s.itemDivider} />
            <QuietHoursTimeRow
              label="From"
              value="10:00 PM"
              disabled={subDisabled || !quietHoursEnabled}
            />
            <View style={s.itemDivider} />
            <QuietHoursTimeRow
              label="To"
              value="7:00 AM"
              disabled={subDisabled || !quietHoursEnabled}
            />
          </View>
        </ScrollView>
      </View>
    </Animated.View>
    </GestureDetector>
  );
}

NotificationSettingsPage.displayName = "NotificationSettingsPage";

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

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A0AEC0",
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: "Inter_700Bold",
  },

  // Section group (card-like container)
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
  sectionGroupDisabled: {
    opacity: 0.5,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 30,
  },

  // Menu item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  menuItemValue: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Toggle item
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  toggleHelpText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 16,
  },

  // Quiet Hours time rows
  quietHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    minHeight: 48,
    paddingLeft: 30,
  },
  quietHoursLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  timePill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timePillText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
