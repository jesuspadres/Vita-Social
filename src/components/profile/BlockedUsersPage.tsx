import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
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
import { ArrowLeft, Ban } from "lucide-react-native";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export interface BlockedUsersPageProps {
  onClose: () => void;
}

interface BlockedUser {
  id: string;
  name: string;
  avatar: string;
  blockedDate: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_BLOCKED_USERS: BlockedUser[] = [
  {
    id: "blocked-1",
    name: "Alex Thompson",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=AlexThompson",
    blockedDate: "Jan 15, 2026",
  },
  {
    id: "blocked-2",
    name: "Jordan Lee",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=JordanLee",
    blockedDate: "Feb 3, 2026",
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BlockedUsersPage({ onClose }: BlockedUsersPageProps) {
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

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(INITIAL_BLOCKED_USERS);

  const handleUnblock = useCallback((userId: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  // Render a single blocked user row
  const renderBlockedUser = useCallback(
    ({ item, index }: { item: BlockedUser; index: number }) => (
      <View style={s.userCardWrapper}>
        <View style={s.userCard}>
          <View style={s.userCardInner}>
            <Avatar size="sm" src={item.avatar} name={item.name} />
            <View style={s.userInfo}>
              <Text style={s.userName}>{item.name}</Text>
              <Text style={s.userBlockedDate}>Blocked on {item.blockedDate}</Text>
            </View>
            <Pressable
              onPress={() => handleUnblock(item.id)}
              style={({ pressed }) => [
                s.unblockBtn,
                pressed && { backgroundColor: "rgba(229,62,62,0.08)" },
              ]}
            >
              <Text style={s.unblockText}>Unblock</Text>
            </Pressable>
          </View>
        </View>
      </View>
    ),
    [handleUnblock],
  );

  // Empty state
  const renderEmptyState = useCallback(
    () => (
      <View style={s.emptyState}>
        <View style={s.emptyIconCircle}>
          <Ban size={28} color={COLORS.secondary} strokeWidth={1.75} />
        </View>
        <Text style={s.emptyTitle}>No blocked users</Text>
        <Text style={s.emptyDesc}>Users you block will appear here</Text>
      </View>
    ),
    [],
  );

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
            <Text style={s.headerTitle}>Blocked Users</Text>
            {blockedUsers.length > 0 && (
              <View style={s.countBadge}>
                <Text style={s.countBadgeText}>{blockedUsers.length}</Text>
              </View>
            )}
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* ── List ── */}
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderBlockedUser}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            blockedUsers.length === 0 && s.emptyContainer,
            {
              paddingBottom: Math.max(insets.bottom, 24) + 40,
              paddingHorizontal: 16,
              paddingTop: blockedUsers.length > 0 ? 12 : 0,
            },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.listSeparator} />}
        />
      </View>
    </Animated.View>
    </GestureDetector>
  );
}

BlockedUsersPage.displayName = "BlockedUsersPage";

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
  countBadge: {
    backgroundColor: COLORS.danger,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },

  // User card
  userCardWrapper: {
    // Outer wrapper for shadow (overflow visible)
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  userCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
  },
  userBlockedDate: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  unblockBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  unblockText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.danger,
    fontFamily: "Inter_600SemiBold",
  },

  // List separator
  listSeparator: {
    height: 10,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
