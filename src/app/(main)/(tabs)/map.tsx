import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  Minus,
  Navigation,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Sun,
  Coffee,
  BookOpen,
  Trophy,
  Palette,
  PawPrint,
  Music,
  Gamepad2,
} from "lucide-react-native";
import { Fab } from "@/components/ui/fab";
import { format } from "date-fns";
import { MOCK_EVENTS, type MockEvent } from "@/lib/mock-data";
import { EventPin } from "@/components/map/EventPin";
import { EventDetailSheet } from "@/components/map/EventDetailSheet";
import { CreateEventSheet } from "@/components/map/CreateEventSheet";
import { CheckInSuccess } from "@/components/map/CheckInSuccess";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type TimeFilter = "now" | "today" | "week";

// Panel uses translateY: 0 = fully expanded, positive = pushed down
const PANEL_FULL_HEIGHT = SCREEN_HEIGHT * 0.6;
const PANEL_COLLAPSED_HEIGHT = 280;
const SNAP_COLLAPSED = PANEL_FULL_HEIGHT - PANEL_COLLAPSED_HEIGHT;
const SNAP_EXPANDED = 0;
const SNAP_THRESHOLD = (SNAP_COLLAPSED - SNAP_EXPANDED) / 2;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Category icon mapping
// ---------------------------------------------------------------------------

type IconComponent = typeof Sun;

interface CategoryStyle {
  Icon: IconComponent;
  bg: string;
  color: string;
}

const CATEGORY_MAP: { keywords: string[]; style: CategoryStyle }[] = [
  {
    keywords: ["yoga", "meditation", "stretch"],
    style: { Icon: Sun, bg: "rgba(56,161,105,0.12)", color: "#38A169" },
  },
  {
    keywords: ["coffee", "café", "cafe", "sketch"],
    style: { Icon: Coffee, bg: "rgba(214,158,46,0.12)", color: "#D69E2E" },
  },
  {
    keywords: ["book", "read", "library"],
    style: { Icon: BookOpen, bg: "rgba(74,144,164,0.12)", color: "#4A90A4" },
  },
  {
    keywords: ["basketball", "soccer", "sport", "pickup", "run"],
    style: { Icon: Trophy, bg: "rgba(229,62,62,0.12)", color: "#E53E3E" },
  },
  {
    keywords: ["paint", "art", "draw", "wine"],
    style: { Icon: Palette, bg: "rgba(128,90,213,0.12)", color: "#805AD5" },
  },
  {
    keywords: ["dog", "walk", "hike", "trail", "market", "farmer"],
    style: { Icon: PawPrint, bg: "rgba(56,161,105,0.12)", color: "#38A169" },
  },
  {
    keywords: ["jazz", "music", "acoustic", "mic", "concert", "live"],
    style: { Icon: Music, bg: "rgba(26,54,93,0.12)", color: "#1A365D" },
  },
  {
    keywords: ["game", "board", "trivia"],
    style: { Icon: Gamepad2, bg: "rgba(74,144,164,0.12)", color: "#4A90A4" },
  },
];

const DEFAULT_CATEGORY: CategoryStyle = {
  Icon: MapPin,
  bg: "rgba(74,144,164,0.12)",
  color: "#4A90A4",
};

function getCategoryStyle(title: string): CategoryStyle {
  const lower = title.toLowerCase();
  for (const entry of CATEGORY_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.style;
    }
  }
  return DEFAULT_CATEGORY;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLive(event: MockEvent): boolean {
  const now = Date.now();
  return new Date(event.starts_at).getTime() <= now && new Date(event.ends_at).getTime() > now;
}

function filterEvents(events: MockEvent[], filter: TimeFilter): MockEvent[] {
  const now = new Date();

  switch (filter) {
    case "now":
      return events.filter((e) => isLive(e));
    case "today": {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return events.filter((e) => new Date(e.starts_at).getTime() <= endOfDay.getTime());
    }
    case "week": {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      return events.filter((e) => new Date(e.starts_at).getTime() <= endOfWeek.getTime());
    }
    default:
      return events;
  }
}

// ---------------------------------------------------------------------------
// Map Screen
// ---------------------------------------------------------------------------

export default function MapScreen() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [checkInEvent, setCheckInEvent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);

  const filteredEvents = useMemo(
    () => filterEvents(MOCK_EVENTS, timeFilter),
    [timeFilter],
  );

  // Sort by distance for the list
  const sortedEvents = useMemo(
    () => [...filteredEvents].sort((a, b) => a.distance - b.distance),
    [filteredEvents],
  );

  const handleCheckIn = useCallback((event: MockEvent) => {
    setSelectedEvent(null);
    setCheckInEvent(event.title);
  }, []);

  // Panel gesture animation
  const translateY = useSharedValue(SNAP_COLLAPSED);
  const contextY = useSharedValue(SNAP_COLLAPSED);

  const updateExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
    if (!expanded) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      scrollOffset.current = 0;
    }
  }, []);

  const springConfig = { damping: 22, stiffness: 180, mass: 0.8 };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = contextY.value + e.translationY;
      // Clamp between expanded (0) and collapsed, with slight overscroll resistance
      if (next < SNAP_EXPANDED) {
        // Rubber-band effect above expanded
        translateY.value = SNAP_EXPANDED + next * 0.15;
      } else if (next > SNAP_COLLAPSED) {
        // Rubber-band effect below collapsed
        const over = next - SNAP_COLLAPSED;
        translateY.value = SNAP_COLLAPSED + over * 0.15;
      } else {
        translateY.value = next;
      }
    })
    .onEnd((e) => {
      const vel = e.velocityY;

      // Fast flick overrides position
      if (vel < -VELOCITY_THRESHOLD) {
        translateY.value = withSpring(SNAP_EXPANDED, springConfig);
        runOnJS(updateExpanded)(true);
        return;
      }
      if (vel > VELOCITY_THRESHOLD) {
        translateY.value = withSpring(SNAP_COLLAPSED, springConfig);
        runOnJS(updateExpanded)(false);
        return;
      }

      // Otherwise snap to nearest
      if (translateY.value < SNAP_THRESHOLD) {
        translateY.value = withSpring(SNAP_EXPANDED, springConfig);
        runOnJS(updateExpanded)(true);
      } else {
        translateY.value = withSpring(SNAP_COLLAPSED, springConfig);
        runOnJS(updateExpanded)(false);
      }
    });

  const handleHeaderTap = useCallback(() => {
    const next = !isExpanded;
    translateY.value = withSpring(
      next ? SNAP_EXPANDED : SNAP_COLLAPSED,
      springConfig,
    );
    updateExpanded(next);
  }, [isExpanded, translateY, updateExpanded]);

  const panelAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const onListScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = e.nativeEvent.contentOffset.y;
    },
    [],
  );

  return (
    <View style={styles.container}>
      {/* Fake Map Background */}
      <View style={styles.mapBg}>
        <LinearGradient
          colors={["#E8F0E4", "#D4E4D4"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Grid overlay -- horizontal lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLineH,
              { top: `${(i + 1) * 8}%` as unknown as number },
            ]}
          />
        ))}

        {/* Grid overlay -- vertical lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLineV,
              { left: `${(i + 1) * 12}%` as unknown as number },
            ]}
          />
        ))}

        {/* Water blob */}
        <View style={styles.waterBlob} />

        {/* Park blob */}
        <View style={styles.parkBlob} />

        {/* Event Pins */}
        {filteredEvents.map((event) => (
          <View
            key={event.id}
            style={{
              position: "absolute",
              left: `${event.pin_x}%` as unknown as number,
              top: `${event.pin_y}%` as unknown as number,
            }}
          >
            <EventPin
              event={event}
              isActive={selectedEvent?.id === event.id}
              onPress={() => setSelectedEvent(event)}
            />
          </View>
        ))}
      </View>

      {/* Filter Bar (overlaid on top) */}
      <SafeAreaView style={styles.filterBarSafe} edges={["top"]} pointerEvents="box-none">
        <View style={styles.filterBar}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Nearby Events</Text>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filteredEvents.length}</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPills}
          >
            {/* Now */}
            <Pressable
              style={[
                styles.pill,
                timeFilter === "now" ? styles.pillActive : styles.pillInactive,
              ]}
              onPress={() => setTimeFilter("now")}
            >
              {timeFilter === "now" && <View style={styles.liveDot} />}
              <Text
                style={[
                  styles.pillText,
                  timeFilter === "now"
                    ? styles.pillTextActive
                    : styles.pillTextInactive,
                ]}
              >
                Now
              </Text>
            </Pressable>

            {/* Today */}
            <Pressable
              style={[
                styles.pill,
                timeFilter === "today" ? styles.pillActive : styles.pillInactive,
              ]}
              onPress={() => setTimeFilter("today")}
            >
              <Text
                style={[
                  styles.pillText,
                  timeFilter === "today"
                    ? styles.pillTextActive
                    : styles.pillTextInactive,
                ]}
              >
                Today
              </Text>
            </Pressable>

            {/* This Week */}
            <Pressable
              style={[
                styles.pill,
                timeFilter === "week" ? styles.pillActive : styles.pillInactive,
              ]}
              onPress={() => setTimeFilter("week")}
            >
              <Text
                style={[
                  styles.pillText,
                  timeFilter === "week"
                    ? styles.pillTextActive
                    : styles.pillTextInactive,
                ]}
              >
                This Week
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Map Controls (right side) */}
      <View style={styles.mapControls}>
        <Pressable
          style={styles.controlBtn}
          accessibilityLabel="Zoom in"
          accessibilityRole="button"
        >
          <Plus size={20} color="#1A365D" />
        </Pressable>
        <Pressable
          style={styles.controlBtn}
          accessibilityLabel="Zoom out"
          accessibilityRole="button"
        >
          <Minus size={20} color="#1A365D" />
        </Pressable>
        <Pressable
          style={styles.controlBtn}
          accessibilityLabel="Center on my location"
          accessibilityRole="button"
        >
          <Navigation size={20} color="#1A365D" />
        </Pressable>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#4A90A4" }]} />
          <Text style={styles.legendText}>Public</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#1A365D" }]} />
          <Text style={styles.legendText}>Group</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#38A169" }]} />
          <Text style={styles.legendText}>Friends</Text>
        </View>
      </View>

      {/* ─── Upcoming Events Panel (slides up from bottom) ─── */}
      <Animated.View style={[styles.eventListPanel, panelAnimStyle]}>
        {/* Draggable handle area */}
        <GestureDetector gesture={panGesture}>
          <Animated.View>
            <Pressable style={styles.eventListHeader} onPress={handleHeaderTap}>
              <View style={styles.dragHandle} />
              <View style={styles.eventListTitleRow}>
                <Text style={styles.eventListTitle}>Upcoming Events</Text>
                <View style={styles.eventListBadge}>
                  <Text style={styles.eventListBadgeText}>{sortedEvents.length}</Text>
                </View>
                <View style={{ flex: 1 }} />
                {isExpanded ? (
                  <ChevronDown size={20} color="#A0AEC0" />
                ) : (
                  <ChevronUp size={20} color="#A0AEC0" />
                )}
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>

        {/* Event cards list */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.eventListContent}
          scrollEnabled={isExpanded}
          onScroll={onListScroll}
          scrollEventThrottle={16}
        >
          {sortedEvents.map((event) => {
            const cat = getCategoryStyle(event.title);
            const timeStr = format(new Date(event.starts_at), "h:mm a");
            const capacityStr = event.max_capacity
              ? `${event.attendee_count}/${event.max_capacity}`
              : `${event.attendee_count}`;

            return (
              <Pressable
                key={event.id}
                style={styles.eventCard}
                onPress={() => setSelectedEvent(event)}
              >
                {/* Category Icon */}
                <View style={[styles.eventIcon, { backgroundColor: cat.bg }]}>
                  <cat.Icon size={20} color={cat.color} />
                </View>

                {/* Event Info */}
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View style={styles.eventMeta}>
                    <View style={styles.metaItem}>
                      <MapPin size={12} color="#A0AEC0" />
                      <Text style={styles.metaText}>{event.distance} mi</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={12} color="#A0AEC0" />
                      <Text style={styles.metaText}>{timeStr}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users size={12} color="#A0AEC0" />
                      <Text style={styles.metaText}>{capacityStr}</Text>
                    </View>
                  </View>
                </View>

                {/* Chevron */}
                <ChevronRight size={20} color="#CBD5E0" />
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* FAB */}
      <Fab
        onPress={() => setShowCreateSheet(true)}
        accessibilityLabel="Create new event"
      />

      {/* Event Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onCheckIn={handleCheckIn}
      />

      {/* Create Event Sheet */}
      <CreateEventSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
      />

      {/* Check-In Success */}
      <CheckInSuccess
        visible={checkInEvent !== null}
        eventTitle={checkInEvent ?? ""}
        onClose={() => setCheckInEvent(null)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F0E4",
  },
  // Fake map background
  mapBg: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(160,174,192,0.25)",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(160,174,192,0.25)",
  },
  waterBlob: {
    position: "absolute",
    right: -20,
    top: "40%",
    width: 140,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(190,227,248,0.6)",
    transform: [{ rotate: "-20deg" }],
  },
  parkBlob: {
    position: "absolute",
    left: 20,
    top: "15%",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(154,230,180,0.5)",
  },
  // Filter bar
  filterBarSafe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterBar: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  filterBadge: {
    backgroundColor: "#1A365D",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  filterPills: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
    minHeight: 40,
  },
  pillActive: {
    backgroundColor: "#1A365D",
  },
  pillInactive: {
    backgroundColor: "#F7FAFC",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  pillTextInactive: {
    color: "#4A5568",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53E3E",
  },
  // Map controls
  mapControls: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -60,
    gap: 8,
    zIndex: 5,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Legend
  legend: {
    position: "absolute",
    bottom: 290,
    left: 16,
    flexDirection: "row",
    gap: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#4A5568",
    fontFamily: "Inter_500Medium",
  },

  // ─── Upcoming Events Panel ───
  eventListPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_FULL_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 8,
  },
  eventListHeader: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E0",
    marginBottom: 12,
  },
  eventListTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
    paddingBottom: 8,
  },
  eventListTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  eventListBadge: {
    backgroundColor: "#4A90A4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  eventListBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  eventListContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Event cards
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },

});
