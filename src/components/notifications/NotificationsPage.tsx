import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  SectionList,
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
  Heart,
  MessageSquare,
  Calendar,
  Users,
  AlertTriangle,
  MapPin,
  Bell,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { COLORS } from "@/lib/constants";
import { MOCK_NOTIFICATIONS, type MockNotification } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export interface NotificationsPageProps {
  onClose: () => void;
}

type NotificationType = MockNotification["type"];

interface NotificationTypeConfig {
  Icon: LucideIcon;
  color: string;
}

const NOTIFICATION_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  match: { Icon: Heart, color: "#E53E3E" },
  message: { Icon: MessageSquare, color: "#4A90A4" },
  event_reminder: { Icon: Calendar, color: "#38A169" },
  group_invite: { Icon: Users, color: "#1A365D" },
  health_warning: { Icon: AlertTriangle, color: "#D69E2E" },
  checkin_reminder: { Icon: MapPin, color: "#4A90A4" },
};

interface NotificationSection {
  title: string;
  data: MockNotification[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeSectionLabel(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  return "Earlier";
}

function formatTimestamp(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function groupNotificationsBySections(
  notifications: MockNotification[],
): NotificationSection[] {
  const sectionOrder = ["Today", "Yesterday", "This Week", "Earlier"];
  const grouped: Record<string, MockNotification[]> = {};

  for (const notif of notifications) {
    const label = getTimeSectionLabel(notif.timestamp);
    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push(notif);
  }

  return sectionOrder
    .filter((label) => grouped[label] && grouped[label].length > 0)
    .map((label) => ({
      title: label,
      data: grouped[label],
    }));
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function NotificationRow({
  notification,
}: {
  notification: MockNotification;
}) {
  const config = NOTIFICATION_CONFIG[notification.type];
  const { Icon, color } = config;
  const isUnread = !notification.read;

  return (
    <Pressable
      style={({ pressed }) => [
        s.notifRow,
        isUnread && s.notifRowUnread,
        pressed && { backgroundColor: "#F7FAFC" },
      ]}
    >
      {/* Left accent border for unread */}
      {isUnread && <View style={[s.unreadAccent, { backgroundColor: color }]} />}

      {/* Icon circle */}
      <View
        style={[
          s.iconCircle,
          { backgroundColor: color + "26" },
          isUnread && { marginLeft: 8 },
        ]}
      >
        <Icon size={18} color={color} />
      </View>

      {/* Content */}
      <View style={s.notifContent}>
        <Text
          style={[
            s.notifTitle,
            isUnread && s.notifTitleUnread,
          ]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={s.notifBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={s.notifTime}>
          {formatTimestamp(notification.timestamp)}
        </Text>
      </View>

      {/* Unread dot */}
      {isUnread && <View style={s.unreadDot} />}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NotificationsPage({ onClose }: NotificationsPageProps) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const sections = useMemo(
    () => groupNotificationsBySections(notifications),
    [notifications],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const hasUnread = unreadCount > 0;

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true })),
    );
  }, []);

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
          {/* ── Header ── */}
          <View style={s.header}>
            <Pressable
              onPress={handleClose}
              style={s.backBtn}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Notifications</Text>
              {hasUnread && (
                <View style={s.headerBadge}>
                  <Text style={s.headerBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            {hasUnread ? (
              <Pressable
                onPress={handleMarkAllRead}
                style={s.markReadBtn}
                hitSlop={8}
              >
                <Text style={s.markReadText}>Mark all read</Text>
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* ── Notification List ── */}
          {sections.length > 0 ? (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <NotificationRow notification={item} />
              )}
              renderSectionHeader={({ section: { title } }) => (
                <View style={s.sectionHeader}>
                  <View style={s.sectionHeaderLine} />
                  <Text style={s.sectionHeaderText}>{title}</Text>
                  <View style={s.sectionHeaderLine} />
                </View>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom, 24) + 40,
              }}
              stickySectionHeadersEnabled={true}
            />
          ) : (
            <View style={s.emptyContainer}>
              <View style={s.emptyIconCircle}>
                <Bell size={32} color={COLORS.secondary} />
              </View>
              <Text style={s.emptyTitle}>All caught up!</Text>
              <Text style={s.emptyDesc}>
                You'll see new notifications here
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

NotificationsPage.displayName = "NotificationsPage";

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
    backgroundColor: "#FFFFFF",
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
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  headerBadge: {
    backgroundColor: COLORS.danger,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  markReadBtn: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A90A4",
    fontFamily: "Inter_600SemiBold",
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F7FAFC",
    gap: 12,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A0AEC0",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },

  // Notification row
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  notifRowUnread: {
    backgroundColor: "rgba(74,144,164,0.04)",
  },

  // Left accent for unread
  unreadAccent: {
    width: 3,
    borderRadius: 1.5,
    alignSelf: "stretch",
    marginRight: 4,
  },

  // Icon circle
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Content
  notifContent: {
    flex: 1,
    marginLeft: 12,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#111827",
    fontFamily: "Inter_400Regular",
  },
  notifTitleUnread: {
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  notifBody: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },

  // Unread dot
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53E3E",
    marginLeft: 8,
    marginTop: 6,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(74,144,164,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
