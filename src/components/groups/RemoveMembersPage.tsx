import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  Alert,
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
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { ArrowLeft, AlertTriangle, Shield } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: "Admin" | "Member";
}

export interface RemoveMembersPageProps {
  onClose: () => void;
  groupName: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_MEMBERS: GroupMember[] = [
  {
    id: "rm-1",
    name: "Alex Thompson",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=AlexThompson",
    role: "Admin",
  },
  {
    id: "rm-2",
    name: "Jordan Rivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=JordanRivera",
    role: "Member",
  },
  {
    id: "rm-3",
    name: "Taylor Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=TaylorKim",
    role: "Member",
  },
  {
    id: "rm-4",
    name: "Casey Morgan",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=CaseyMorgan",
    role: "Member",
  },
  {
    id: "rm-5",
    name: "Priya Sharma",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=PriyaSharma",
    role: "Member",
  },
  {
    id: "rm-6",
    name: "Liam O'Brien",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=LiamOBrien",
    role: "Member",
  },
];

// ---------------------------------------------------------------------------
// Member Row
// ---------------------------------------------------------------------------

function MemberRow({
  member,
  onRemove,
}: {
  member: GroupMember;
  onRemove: (member: GroupMember) => void;
}) {
  const isAdmin = member.role === "Admin";

  return (
    <Animated.View
      style={s.memberRow}
      exiting={FadeOut.duration(250)}
      layout={Layout.springify().damping(18).stiffness(200)}
    >
      <Image source={{ uri: member.avatar }} style={s.avatar} />
      <View style={s.memberInfo}>
        <Text style={s.memberName}>{member.name}</Text>
        <Text style={s.memberRole}>{member.role}</Text>
      </View>
      {isAdmin ? (
        <View style={s.adminBadge}>
          <Shield size={12} color={COLORS.primary} strokeWidth={2} />
          <Text style={s.adminBadgeText}>Admin</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => onRemove(member)}
          style={({ pressed }) => [
            s.removeBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={s.removeBtnText}>Remove</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RemoveMembersPage({
  onClose,
  groupName,
}: RemoveMembersPageProps) {
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
        translateX.value = withTiming(
          SCREEN_WIDTH,
          { duration: 250 },
          (finished) => {
            if (finished) runOnJS(onClose)();
          },
        );
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  // Members state
  const [members, setMembers] = useState<GroupMember[]>(INITIAL_MEMBERS);

  const handleRemove = useCallback(
    (member: GroupMember) => {
      Alert.alert(
        `Remove ${member.name}?`,
        "They will no longer have access to this group",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              setMembers((prev) => prev.filter((m) => m.id !== member.id));
            },
          },
        ],
      );
    },
    [],
  );

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
            <Text style={s.headerTitle}>Remove Members</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Warning banner */}
          <View style={s.warningBanner}>
            <AlertTriangle
              size={18}
              color={COLORS.danger}
              strokeWidth={1.75}
            />
            <Text style={s.warningText}>
              Removed members will need to request to rejoin
            </Text>
          </View>

          {/* Member list */}
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemberRow member={item} onRemove={handleRemove} />
            )}
            contentContainerStyle={[
              s.listContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={s.separator} />}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

RemoveMembersPage.displayName = "RemoveMembersPage";

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

  // Warning banner
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(229,62,62,0.06)",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.danger,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 56,
  },

  // Member row
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  memberRole: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Admin badge
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(26,54,93,0.08)",
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },

  // Remove button
  removeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.danger,
    minHeight: 34,
    justifyContent: "center",
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.danger,
    fontFamily: "Inter_600SemiBold",
  },
});
