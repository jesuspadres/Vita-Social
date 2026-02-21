import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
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
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { ArrowLeft, CheckCircle } from "lucide-react-native";
import { COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberRequest {
  id: string;
  name: string;
  avatar: string;
  mutualConnections: number;
  requestedAt: string;
}

export interface MemberRequestsPageProps {
  onClose: () => void;
  groupName: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const INITIAL_REQUESTS: MemberRequest[] = [
  {
    id: "req-1",
    name: "Jordan Rivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=JordanRivera",
    mutualConnections: 4,
    requestedAt: "2 hours ago",
  },
  {
    id: "req-2",
    name: "Taylor Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=TaylorKim",
    mutualConnections: 7,
    requestedAt: "1 day ago",
  },
  {
    id: "req-3",
    name: "Casey Morgan",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=CaseyMorgan",
    mutualConnections: 2,
    requestedAt: "3 days ago",
  },
];

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------

function RequestCard({
  request,
  onApprove,
  onDecline,
}: {
  request: MemberRequest;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <Animated.View
      style={s.requestCard}
      exiting={FadeOut.duration(250)}
      layout={Layout.springify().damping(18).stiffness(200)}
    >
      {/* Top row: avatar + info */}
      <View style={s.requestTopRow}>
        <Image source={{ uri: request.avatar }} style={s.avatar} />
        <View style={s.requestInfo}>
          <Text style={s.requestName}>{request.name}</Text>
          <Text style={s.requestMutual}>
            {request.mutualConnections} mutual connections
          </Text>
        </View>
      </View>

      {/* Timestamp */}
      <Text style={s.requestTimestamp}>Requested {request.requestedAt}</Text>

      {/* Action row */}
      <View style={s.actionRow}>
        <Pressable
          onPress={() => onDecline(request.id)}
          style={({ pressed }) => [
            s.declineBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={s.declineBtnText}>Decline</Text>
        </Pressable>
        <Pressable
          onPress={() => onApprove(request.id)}
          style={({ pressed }) => [
            s.approveBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={s.approveBtnText}>Approve</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={s.emptyContainer}>
      <View style={s.emptyIconCircle}>
        <CheckCircle size={32} color={COLORS.secondary} strokeWidth={1.75} />
      </View>
      <Text style={s.emptyTitle}>No pending requests</Text>
      <Text style={s.emptyDesc}>
        All member requests have been handled. New requests will appear here.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MemberRequestsPage({
  onClose,
  groupName,
}: MemberRequestsPageProps) {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();

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

  // Request state
  const [requests, setRequests] = useState<MemberRequest[]>(INITIAL_REQUESTS);

  const handleApprove = useCallback(
    (id: string) => {
      const req = requests.find((r) => r.id === id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (req) {
        toast(`${req.name} approved!`, "success");
      }
    },
    [requests, toast],
  );

  const handleDecline = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

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
            <View style={s.headerTitleRow}>
              <Text style={s.headerTitle}>Member Requests</Text>
              {requests.length > 0 && (
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{requests.length}</Text>
                </View>
              )}
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Content */}
          {requests.length === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RequestCard
                  request={item}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                />
              )}
              contentContainerStyle={[
                s.listContent,
                { paddingBottom: Math.max(insets.bottom, 24) + 20 },
              ]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

MemberRequestsPage.displayName = "MemberRequestsPage";

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
  headerTitleRow: {
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
    backgroundColor: COLORS.secondary,
    borderRadius: 999,
    minWidth: 22,
    height: 22,
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

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },

  // Request card
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  requestTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  requestMutual: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  requestTimestamp: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    marginLeft: 60,
  },

  // Action row
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.danger,
    fontFamily: "Inter_600SemiBold",
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },

  // Empty state
  emptyContainer: {
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
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: "400",
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
