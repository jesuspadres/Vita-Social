import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  Dimensions,
  StyleSheet,
  useWindowDimensions,
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
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Clock,
} from "lucide-react-native";
import { Fab } from "@/components/ui/fab";
import { CreateEventSheet } from "@/components/map/CreateEventSheet";
import { COLORS } from "@/lib/constants";
import {
  CURRENT_USER_EVENTS,
  CURRENT_USER_UPCOMING_EVENTS,
  type MockUserEvent,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH_STATIC = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH_STATIC * 0.3;
const VELOCITY_THRESHOLD = 500;
const TAB_COUNT = 2;
const TAB_KEYS = ["upcoming", "past"] as const;

type Tab = (typeof TAB_KEYS)[number];

export interface MyEventsPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Format date helpers
// ---------------------------------------------------------------------------

function formatPastDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatUpcomingDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `In ${weeks} week${weeks > 1 ? "s" : ""}`;
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Animated Tab Label
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
// Event Card
// ---------------------------------------------------------------------------

function EventCard({
  item,
  index,
  isUpcoming,
}: {
  item: MockUserEvent;
  index: number;
  isUpcoming: boolean;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
      >
        <Image
          source={{ uri: item.coverImage }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.cardMeta}>
            <MapPin size={13} color="#9CA3AF" />
            <Text style={styles.cardMetaText} numberOfLines={1}>
              {item.locationName}
            </Text>
          </View>
          <View style={styles.cardMeta}>
            {isUpcoming ? (
              <>
                <Clock size={13} color={COLORS.secondary} />
                <Text style={styles.cardMetaText}>
                  {formatUpcomingDate(item.date)} · {formatTime(item.date)}
                </Text>
              </>
            ) : (
              <>
                <Calendar size={13} color="#9CA3AF" />
                <Text style={styles.cardMetaText}>
                  {formatPastDate(item.date)}
                </Text>
              </>
            )}
          </View>
          <View style={styles.cardBottom}>
            <Users size={13} color={COLORS.secondary} />
            <Text style={styles.cardAttendees}>
              {isUpcoming
                ? `${item.attendeeCount} going`
                : `${item.attendeeCount} attended`}
            </Text>
            {item.groupName && (
              <Text style={styles.cardGroup} numberOfLines={1}>
                · {item.groupName}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MyEventsPage({ onClose }: MyEventsPageProps) {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_W } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Tab pill layout
  const [pillContainerWidth, setPillContainerWidth] = useState(0);

  // Shared values
  const pageSlideX = useSharedValue(SCREEN_WIDTH_STATIC); // page slide-in/dismiss
  const tabPagerX = useSharedValue(0); // horizontal tab pager
  const tabContextX = useSharedValue(0);

  // Pill follows swipe in real-time
  const pillStyle = useAnimatedStyle(() => {
    if (pillContainerWidth === 0 || SCREEN_W === 0) {
      return { width: 0, transform: [{ translateX: 0 }] };
    }
    const tw = pillContainerWidth / TAB_COUNT;
    const progress = -tabPagerX.value / SCREEN_W;
    return {
      transform: [{ translateX: progress * tw }],
      width: tw,
    };
  });

  // Tab content slides with finger
  const tabContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPagerX.value }],
  }));

  // Page slide-in/dismiss animation
  const pageSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pageSlideX.value }],
  }));

  // Slide-in on mount
  useEffect(() => {
    pageSlideX.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezierFn(0.22, 1, 0.36, 1),
    });
  }, [pageSlideX]);

  const handleClose = useCallback(() => {
    pageSlideX.value = withTiming(SCREEN_WIDTH_STATIC, { duration: 250 });
    setTimeout(onClose, 260);
  }, [pageSlideX, onClose]);

  const setTabWithHaptic = useCallback((key: Tab) => {
    setActiveTab(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleTabPress = useCallback(
    (tab: Tab) => {
      const index = TAB_KEYS.indexOf(tab);
      tabPagerX.value = withTiming(-index * SCREEN_W, { duration: 300 });
      setTabWithHaptic(tab);
    },
    [SCREEN_W, tabPagerX, setTabWithHaptic],
  );

  // Combined gesture: tab switching + dismiss (swipe right past first tab)
  const combinedGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      tabContextX.value = tabPagerX.value;
    })
    .onUpdate((e) => {
      const rawNewX = tabContextX.value + e.translationX;
      const maxX = 0;
      const minX = -(TAB_COUNT - 1) * SCREEN_W;

      if (rawNewX > maxX) {
        // Past first tab → dismiss mode
        tabPagerX.value = maxX;
        pageSlideX.value = rawNewX - maxX;
      } else if (rawNewX < minX) {
        // Past last tab → rubber band
        tabPagerX.value = minX + (rawNewX - minX) * 0.3;
        pageSlideX.value = 0;
      } else {
        // Normal tab switching
        tabPagerX.value = rawNewX;
        pageSlideX.value = 0;
      }
    })
    .onEnd((e) => {
      if (pageSlideX.value > 0) {
        // Was in dismiss mode
        if (
          pageSlideX.value > SWIPE_THRESHOLD ||
          e.velocityX > VELOCITY_THRESHOLD
        ) {
          pageSlideX.value = withTiming(
            SCREEN_WIDTH_STATIC,
            { duration: 250 },
            (finished) => {
              if (finished) runOnJS(onClose)();
            },
          );
        } else {
          pageSlideX.value = withSpring(0, { damping: 20, stiffness: 300 });
        }
      } else {
        // Tab snap
        const currentPage = -tabPagerX.value / SCREEN_W;
        let targetPage: number;
        if (Math.abs(e.velocityX) > 500) {
          targetPage =
            e.velocityX > 0
              ? Math.floor(currentPage)
              : Math.ceil(currentPage);
        } else {
          targetPage = Math.round(currentPage);
        }
        targetPage = Math.max(0, Math.min(TAB_COUNT - 1, targetPage));

        tabPagerX.value = withSpring(-targetPage * SCREEN_W, {
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        });
        runOnJS(setTabWithHaptic)(TAB_KEYS[targetPage]);
      }
    });

  // Tab data
  const tabData = [CURRENT_USER_UPCOMING_EVENTS, CURRENT_USER_EVENTS];

  const renderUpcomingItem = useCallback(
    ({ item, index }: { item: MockUserEvent; index: number }) => (
      <EventCard item={item} index={index} isUpcoming />
    ),
    [],
  );

  const renderPastItem = useCallback(
    ({ item, index }: { item: MockUserEvent; index: number }) => (
      <EventCard item={item} index={index} isUpcoming={false} />
    ),
    [],
  );

  const renderItems = [renderUpcomingItem, renderPastItem];

  const emptyMessages = [
    { title: "No upcoming events", desc: "Tap + to create your first event" },
    { title: "No past events", desc: "Events you attend will show up here" },
  ];

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={[styles.overlay, pageSlideStyle]}>
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
            <Text style={styles.headerTitle}>My Events</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Tab Switcher — pill tracks finger */}
          <View style={styles.tabRow}>
            <View
              style={styles.tabContainer}
              onLayout={(e) =>
                setPillContainerWidth(e.nativeEvent.layout.width)
              }
            >
              <Animated.View style={[styles.pill, pillStyle]} />

              <AnimatedTabLabel
                label={`Upcoming (${CURRENT_USER_UPCOMING_EVENTS.length})`}
                index={0}
                translateX={tabPagerX}
                screenWidth={SCREEN_W}
                onPress={() => handleTabPress("upcoming")}
              />
              <AnimatedTabLabel
                label={`Past (${CURRENT_USER_EVENTS.length})`}
                index={1}
                translateX={tabPagerX}
                screenWidth={SCREEN_W}
                onPress={() => handleTabPress("past")}
              />
            </View>
          </View>

          {/* Swipeable Tab Content */}
          <View style={styles.pagerContainer}>
            <Animated.View
              style={[
                styles.pagerContent,
                { width: SCREEN_W * TAB_COUNT },
                tabContentStyle,
              ]}
            >
              {tabData.map((data, tabIndex) => (
                <View
                  key={TAB_KEYS[tabIndex]}
                  style={{ width: SCREEN_W, flex: 1 }}
                >
                  <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItems[tabIndex]}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>
                          {emptyMessages[tabIndex].title}
                        </Text>
                        <Text style={styles.emptyDesc}>
                          {emptyMessages[tabIndex].desc}
                        </Text>
                      </View>
                    }
                  />
                </View>
              ))}
            </Animated.View>
          </View>

          {/* FAB */}
          <Fab onPress={() => setShowCreateEvent(true)} accessibilityLabel="Create new event" />
        </View>

        {/* Create Event Sheet */}
        <CreateEventSheet
          visible={showCreateEvent}
          onClose={() => setShowCreateEvent(false)}
        />
      </Animated.View>
    </GestureDetector>
  );
}

MyEventsPage.displayName = "MyEventsPage";

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

  // Tab Switcher
  tabRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#EDF2F7",
    borderRadius: 999,
    padding: 4,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    minHeight: 40,
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
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },

  // Empty State
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

  // Event card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardImage: {
    width: "100%",
    height: 150,
  },
  cardContent: {
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardMetaText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  cardAttendees: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: "Inter_500Medium",
  },
  cardGroup: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
});
