import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
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
  FadeInUp,
  runOnJS,
} from "react-native-reanimated";
import {
  ArrowLeft,
  Heart,
  Users,
  Calendar,
  MessageCircle,
} from "lucide-react-native";
import { Avatar } from "@/components/ui/avatar";
import { COLORS } from "@/lib/constants";
import {
  CURRENT_USER_CONNECTIONS,
  type MockConnection,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

type Filter = "all" | "match" | "event" | "group";

export interface MyConnectionsPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Connection Via Config
// ---------------------------------------------------------------------------

const viaConfig = {
  match: { Icon: Heart, color: COLORS.danger, label: "Matched" },
  event: { Icon: Calendar, color: COLORS.success, label: "Met at event" },
  group: { Icon: Users, color: COLORS.secondary, label: "From group" },
} as const;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "match", label: "Connections" },
  { key: "group", label: "Groups" },
  { key: "event", label: "Events" },
];

// ---------------------------------------------------------------------------
// Connection Card
// ---------------------------------------------------------------------------

function ConnectionCard({
  item,
  index,
}: {
  item: MockConnection;
  index: number;
}) {
  const via = viaConfig[item.connectedVia];

  return (
    <Animated.View entering={FadeInUp.duration(350).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        {/* Top row: Avatar + Name + Message btn */}
        <View style={styles.cardTop}>
          <Avatar
            size="lg"
            src={item.avatarUrl}
            name={item.firstName}
            online={item.online}
            badge={
              item.verificationLevel === "id"
                ? "blue"
                : item.verificationLevel === "photo"
                  ? "green"
                  : "none"
            }
          />

          <View style={styles.cardNameCol}>
            <Text style={styles.cardName}>{item.firstName}</Text>
            <View style={styles.cardViaRow}>
              <via.Icon size={12} color={via.color} />
              <Text style={styles.cardViaText}>{via.label}</Text>
            </View>
          </View>

          <Pressable style={styles.messageBtn} hitSlop={8}>
            <MessageCircle size={18} color={COLORS.secondary} />
          </Pressable>
        </View>

        {/* Interests row */}
        {item.interests.length > 0 && (
          <View style={styles.cardInterests}>
            {item.interests.slice(0, 3).map((interest) => (
              <View key={interest} style={styles.interestChip}>
                <Text style={styles.interestChipText}>{interest}</Text>
              </View>
            ))}
            {item.mutualGroups != null && item.mutualGroups > 0 && (
              <View style={styles.mutualChip}>
                <Users size={10} color={COLORS.primary} />
                <Text style={styles.mutualChipText}>
                  {item.mutualGroups} mutual
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MyConnectionsPage({ onClose }: MyConnectionsPageProps) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

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

  const filteredConnections = useMemo(() => {
    if (activeFilter === "all") return CURRENT_USER_CONNECTIONS;
    return CURRENT_USER_CONNECTIONS.filter(
      (c) => c.connectedVia === activeFilter,
    );
  }, [activeFilter]);

  const renderItem = useCallback(
    ({ item, index }: { item: MockConnection; index: number }) => (
      <ConnectionCard item={item} index={index} />
    ),
    [],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.overlay, slideStyle]}>
        <View style={[styles.root, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={handleClose}
              style={styles.backBtn}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <Text style={styles.headerTitle}>My Connections</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Filter tabs */}
          <View style={styles.filterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {filters.map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setActiveFilter(f.key)}
                    style={[
                      styles.filterPill,
                      isActive && styles.filterPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isActive && styles.filterTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* List */}
          <FlatList
            data={filteredConnections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No connections</Text>
                <Text style={styles.emptyDesc}>
                  No connections in this category yet
                </Text>
              </View>
            }
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

MyConnectionsPage.displayName = "MyConnectionsPage";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },

  // Filter tabs
  filterRow: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    minHeight: 36,
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "Inter_600SemiBold",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },

  // List
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
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

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: "#FAFBFC",
  },

  // Top row
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardNameCol: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },
  cardViaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardViaText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },

  // Message button
  messageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Interests
  cardInterests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F3F4F6",
  },
  interestChip: {
    backgroundColor: "rgba(74, 144, 164, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  interestChipText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: "Inter_500Medium",
  },
  mutualChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(26, 54, 93, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  mutualChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: "Inter_500Medium",
  },
});
