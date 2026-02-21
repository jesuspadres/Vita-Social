import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Newspaper } from "lucide-react-native";
import { Fab } from "@/components/ui/fab";
import { FeedPost } from "@/components/feed/FeedPost";
import { FeedPostDetailPage } from "@/components/feed/FeedPostDetailPage";
import { CreatePostSheet } from "@/components/feed/CreatePostSheet";
import { mockFeedPosts, type MockFeedPost } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

type FeedTab = "all" | "connections" | "groups";

const TAB_LABELS: { key: FeedTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "connections", label: "Connections" },
  { key: "groups", label: "Groups" },
];

const TAB_COUNT = TAB_LABELS.length;

const EMPTY_MESSAGES = [
  "Your feed is empty. Connect with people and join groups to get started!",
  "Your connections haven't posted yet. Check back soon!",
  "No group posts to show. Join more groups to see content here.",
];

// ---------------------------------------------------------------------------
// Animated Tab Label — text color follows swipe progress in real-time
// ---------------------------------------------------------------------------

function AnimatedTabLabel({
  label,
  index,
  translateX,
  screenWidth,
  onPress,
}: {
  label: string;
  index: number;
  translateX: SharedValue<number>;
  screenWidth: number;
  onPress: () => void;
}) {
  const textStyle = useAnimatedStyle(() => {
    const progress = screenWidth > 0 ? -translateX.value / screenWidth : 0;
    const color = interpolateColor(
      progress,
      [index - 1, index, index + 1],
      ["#A0AEC0", "#FFFFFF", "#A0AEC0"],
    );
    return { color };
  });

  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Animated.Text style={[styles.tabText, textStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Feed Screen
// ---------------------------------------------------------------------------

export default function FeedScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MockFeedPost | null>(null);

  // Tab pill layout
  const [pillContainerWidth, setPillContainerWidth] = useState(0);

  // Shared values for the horizontal pager
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  // ── Pill indicator follows swipe in real-time ──

  const pillStyle = useAnimatedStyle(() => {
    if (pillContainerWidth === 0 || SCREEN_WIDTH === 0) {
      return { width: 0, transform: [{ translateX: 0 }] };
    }
    const tw = pillContainerWidth / TAB_COUNT;
    const progress = -translateX.value / SCREEN_WIDTH;
    return {
      transform: [{ translateX: progress * tw }],
      width: tw,
    };
  });

  // ── Content pager slides with finger ──

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // ── Tab change with haptic ──

  const setTabWithHaptic = useCallback((key: FeedTab) => {
    setActiveTab(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleTabPress = useCallback(
    (tab: FeedTab) => {
      const index = TAB_LABELS.findIndex((t) => t.key === tab);
      translateX.value = withTiming(-index * SCREEN_WIDTH, { duration: 300 });
      setTabWithHaptic(tab);
    },
    [SCREEN_WIDTH, translateX, setTabWithHaptic],
  );

  // ── Data for each tab (pre-computed) ──

  const allPosts = useMemo(() => mockFeedPosts, []);
  const connectionPosts = useMemo(
    () => mockFeedPosts.filter((p) => p.source.type === "connection"),
    [],
  );
  const groupPosts = useMemo(
    () =>
      mockFeedPosts.filter(
        (p) => p.source.type === "group" || p.source.type === "suggested",
      ),
    [],
  );
  const tabData = useMemo(
    () => [allPosts, connectionPosts, groupPosts],
    [allPosts, connectionPosts, groupPosts],
  );

  // ── Pull to refresh ──

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // ── Pan gesture — swipe between tabs with real-time tracking ──

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((e) => {
      const newX = contextX.value + e.translationX;
      const maxX = 0;
      const minX = -(TAB_COUNT - 1) * SCREEN_WIDTH;
      // Rubber-band resistance at edges
      if (newX > maxX) {
        translateX.value = maxX + (newX - maxX) * 0.3;
      } else if (newX < minX) {
        translateX.value = minX + (newX - minX) * 0.3;
      } else {
        translateX.value = newX;
      }
    })
    .onEnd((e) => {
      const currentPage = -translateX.value / SCREEN_WIDTH;
      let targetPage: number;
      // Velocity-based snapping
      if (Math.abs(e.velocityX) > 500) {
        targetPage =
          e.velocityX > 0 ? Math.floor(currentPage) : Math.ceil(currentPage);
      } else {
        targetPage = Math.round(currentPage);
      }
      targetPage = Math.max(0, Math.min(TAB_COUNT - 1, targetPage));

      translateX.value = withSpring(-targetPage * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 200,
        overshootClamping: true,
      });
      runOnJS(setTabWithHaptic)(TAB_LABELS[targetPage].key);
    });

  // ── Renderers ──

  const renderItem = useCallback(
    ({ item }: { item: MockFeedPost }) => (
      <FeedPost post={item} onPress={() => setSelectedPost(item)} />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>

      {/* Tab Switcher — pill tracks finger in real-time */}
      <View style={styles.tabRow}>
        <View
          style={styles.tabContainer}
          onLayout={(e) => setPillContainerWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.pill, pillStyle]} />

          {TAB_LABELS.map((tab, index) => (
            <AnimatedTabLabel
              key={tab.key}
              label={tab.label}
              index={index}
              translateX={translateX}
              screenWidth={SCREEN_WIDTH}
              onPress={() => handleTabPress(tab.key)}
            />
          ))}
        </View>
      </View>

      {/* Swipeable Feed Pager — whole feed moves with finger */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={styles.pagerContainer}>
          <Animated.View
            style={[
              styles.pagerContent,
              { width: SCREEN_WIDTH * TAB_COUNT },
              contentStyle,
            ]}
          >
            {tabData.map((data, index) => (
              <View
                key={TAB_LABELS[index].key}
                style={{ width: SCREEN_WIDTH }}
              >
                <FlatList
                  data={data}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      tintColor="#1A365D"
                      colors={["#1A365D"]}
                    />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <View style={styles.emptyIconCircle}>
                        <Newspaper size={32} color="#4A90A4" />
                      </View>
                      <Text style={styles.emptyTitle}>No posts yet</Text>
                      <Text style={styles.emptyDesc}>
                        {EMPTY_MESSAGES[index]}
                      </Text>
                    </View>
                  }
                />
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* FAB */}
      <Fab onPress={() => setShowCreatePost(true)} accessibilityLabel="Create new post" />

      {/* Create Post Sheet */}
      <CreatePostSheet
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />

      {/* Post Detail Overlay */}
      {selectedPost && (
        <FeedPostDetailPage
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },

  // Tab Switcher
  tabRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F7FAFC",
    borderRadius: 999,
    padding: 4,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: "#1A365D",
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  // Horizontal pager
  pagerContainer: {
    flex: 1,
    overflow: "hidden",
  },
  pagerContent: {
    flexDirection: "row",
    flex: 1,
  },

  // List
  listContent: {
    paddingBottom: 80,
  },

  // Empty State
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
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A365D",
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
