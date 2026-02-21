import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
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
} from "react-native-reanimated";
import {
  ArrowLeft,
  Search,
  Clock,
  X,
  TrendingUp,
  Calendar,
  Users,
  ChevronRight,
} from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

function dicebear(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

interface RecentSearch {
  id: string;
  text: string;
}

interface TrendingTopic {
  id: string;
  text: string;
}

interface SearchPerson {
  id: string;
  name: string;
  subtitle: string;
  avatar_url: string;
}

interface SearchGroup {
  id: string;
  name: string;
  memberCount: number;
  cover_url: string;
}

interface SearchEvent {
  id: string;
  name: string;
  date: string;
}

const MOCK_RECENT_SEARCHES: RecentSearch[] = [
  { id: "rs-1", text: "Yoga in the park" },
  { id: "rs-2", text: "Austin Climbers" },
  { id: "rs-3", text: "Coffee meetup" },
  { id: "rs-4", text: "Board games" },
];

const MOCK_TRENDING: TrendingTopic[] = [
  { id: "tr-1", text: "Live Music ATX" },
  { id: "tr-2", text: "Outdoor Adventures" },
  { id: "tr-3", text: "Photography Walks" },
  { id: "tr-4", text: "Weekend Brunch" },
];

const MOCK_PEOPLE: SearchPerson[] = [
  {
    id: "sp-1",
    name: "Amara Chen",
    subtitle: "Product Designer",
    avatar_url: dicebear("AmaraChen"),
  },
  {
    id: "sp-2",
    name: "Jordan Rivera",
    subtitle: "Photographer",
    avatar_url: dicebear("JordanRivera"),
  },
  {
    id: "sp-3",
    name: "Priya Patel",
    subtitle: "Yoga Instructor",
    avatar_url: dicebear("PriyaPatel"),
  },
];

const MOCK_GROUPS: SearchGroup[] = [
  {
    id: "sg-1",
    name: "Austin Climbers",
    memberCount: 24,
    cover_url: dicebear("AustinClimbers"),
  },
  {
    id: "sg-2",
    name: "Vinyl Collectors ATX",
    memberCount: 18,
    cover_url: dicebear("VinylCollectors"),
  },
  {
    id: "sg-3",
    name: "Design + Coffee",
    memberCount: 31,
    cover_url: dicebear("DesignCoffee"),
  },
];

const MOCK_EVENTS: SearchEvent[] = [
  { id: "se-1", name: "Sunset Yoga in the Park", date: "Today, 6:00 PM" },
  { id: "se-2", name: "Coffee & Sketch Meetup", date: "Tomorrow, 10:00 AM" },
  { id: "se-3", name: "Live Jazz & Open Mic", date: "Sat, 8:00 PM" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GlobalSearchPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function SeeAllLink() {
  return (
    <Pressable style={s.seeAllRow}>
      <Text style={s.seeAllText}>See all</Text>
      <ChevronRight size={14} color={COLORS.secondary} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalSearchPage({ onClose }: GlobalSearchPageProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(MOCK_RECENT_SEARCHES);

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

  const removeRecentSearch = useCallback((id: string) => {
    setRecentSearches((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const hasQuery = query.trim().length > 0;

  // Simple client-side filtering for mock
  const filteredPeople = useMemo(
    () =>
      hasQuery
        ? MOCK_PEOPLE.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase())
          )
        : MOCK_PEOPLE,
    [query, hasQuery]
  );

  const filteredGroups = useMemo(
    () =>
      hasQuery
        ? MOCK_GROUPS.filter((g) =>
            g.name.toLowerCase().includes(query.toLowerCase())
          )
        : MOCK_GROUPS,
    [query, hasQuery]
  );

  const filteredEvents = useMemo(
    () =>
      hasQuery
        ? MOCK_EVENTS.filter((e) =>
            e.name.toLowerCase().includes(query.toLowerCase())
          )
        : MOCK_EVENTS,
    [query, hasQuery]
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
            <View style={s.searchBarContainer}>
              <Search size={18} color="#A0AEC0" />
              <TextInput
                style={s.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search people, groups, events..."
                placeholderTextColor="#A0AEC0"
                autoFocus
                returnKeyType="search"
              />
              {hasQuery && (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <X size={16} color="#A0AEC0" />
                </Pressable>
              )}
            </View>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 40 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!hasQuery ? (
              /* ─── Empty state: Recent + Trending ─── */
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <>
                    <SectionHeader title="RECENT SEARCHES" />
                    <View style={s.sectionGroup}>
                      {recentSearches.map((item, index) => (
                        <React.Fragment key={item.id}>
                          <View style={s.recentItem}>
                            <Clock size={16} color="#A0AEC0" />
                            <Text style={s.recentText}>{item.text}</Text>
                            <Pressable
                              onPress={() => removeRecentSearch(item.id)}
                              hitSlop={8}
                              style={s.recentRemove}
                            >
                              <X size={14} color="#CBD5E0" />
                            </Pressable>
                          </View>
                          {index < recentSearches.length - 1 && (
                            <View style={s.itemDivider} />
                          )}
                        </React.Fragment>
                      ))}
                    </View>
                  </>
                )}

                {/* Trending */}
                <SectionHeader title="TRENDING" />
                <View style={s.sectionGroup}>
                  {MOCK_TRENDING.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <Pressable
                        style={({ pressed }) => [
                          s.trendingItem,
                          pressed && { backgroundColor: "#F7FAFC" },
                        ]}
                        onPress={() => setQuery(item.text)}
                      >
                        <TrendingUp size={16} color={COLORS.secondary} />
                        <Text style={s.trendingText}>{item.text}</Text>
                      </Pressable>
                      {index < MOCK_TRENDING.length - 1 && (
                        <View style={s.itemDivider} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </>
            ) : (
              /* ─── Results state ─── */
              <>
                {/* People */}
                {filteredPeople.length > 0 && (
                  <>
                    <SectionHeader title="PEOPLE" />
                    <View style={s.sectionGroup}>
                      {filteredPeople.map((person, index) => (
                        <React.Fragment key={person.id}>
                          <Pressable
                            style={({ pressed }) => [
                              s.personRow,
                              pressed && { backgroundColor: "#F7FAFC" },
                            ]}
                          >
                            <Image
                              source={{ uri: person.avatar_url }}
                              style={s.personAvatar}
                            />
                            <View style={s.personInfo}>
                              <Text style={s.personName}>{person.name}</Text>
                              <Text style={s.personSub}>{person.subtitle}</Text>
                            </View>
                            <ChevronRight size={16} color="#CBD5E0" />
                          </Pressable>
                          {index < filteredPeople.length - 1 && (
                            <View style={s.itemDivider} />
                          )}
                        </React.Fragment>
                      ))}
                      <SeeAllLink />
                    </View>
                  </>
                )}

                {/* Groups */}
                {filteredGroups.length > 0 && (
                  <>
                    <SectionHeader title="GROUPS" />
                    <View style={s.sectionGroup}>
                      {filteredGroups.map((group, index) => (
                        <React.Fragment key={group.id}>
                          <Pressable
                            style={({ pressed }) => [
                              s.groupRow,
                              pressed && { backgroundColor: "#F7FAFC" },
                            ]}
                          >
                            <Image
                              source={{ uri: group.cover_url }}
                              style={s.groupThumb}
                            />
                            <View style={s.groupInfo}>
                              <Text style={s.groupName}>{group.name}</Text>
                              <Text style={s.groupSub}>
                                {group.memberCount} members
                              </Text>
                            </View>
                            <ChevronRight size={16} color="#CBD5E0" />
                          </Pressable>
                          {index < filteredGroups.length - 1 && (
                            <View style={s.itemDivider} />
                          )}
                        </React.Fragment>
                      ))}
                      <SeeAllLink />
                    </View>
                  </>
                )}

                {/* Events */}
                {filteredEvents.length > 0 && (
                  <>
                    <SectionHeader title="EVENTS" />
                    <View style={s.sectionGroup}>
                      {filteredEvents.map((event, index) => (
                        <React.Fragment key={event.id}>
                          <Pressable
                            style={({ pressed }) => [
                              s.eventRow,
                              pressed && { backgroundColor: "#F7FAFC" },
                            ]}
                          >
                            <View style={s.eventIconCircle}>
                              <Calendar size={16} color={COLORS.secondary} />
                            </View>
                            <View style={s.eventInfo}>
                              <Text style={s.eventName}>{event.name}</Text>
                              <Text style={s.eventDate}>{event.date}</Text>
                            </View>
                            <ChevronRight size={16} color="#CBD5E0" />
                          </Pressable>
                          {index < filteredEvents.length - 1 && (
                            <View style={s.itemDivider} />
                          )}
                        </React.Fragment>
                      ))}
                      <SeeAllLink />
                    </View>
                  </>
                )}

                {/* No results */}
                {filteredPeople.length === 0 &&
                  filteredGroups.length === 0 &&
                  filteredEvents.length === 0 && (
                    <View style={s.emptyContainer}>
                      <View style={s.emptyIconCircle}>
                        <Search size={32} color={COLORS.secondary} />
                      </View>
                      <Text style={s.emptyTitle}>No results found</Text>
                      <Text style={s.emptyDesc}>
                        Try adjusting your search terms or explore trending
                        topics.
                      </Text>
                    </View>
                  )}
              </>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

GlobalSearchPage.displayName = "GlobalSearchPage";

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
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#2D3748",
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
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
    marginLeft: 30,
  },

  // Recent searches
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  recentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  recentRemove: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  // Trending
  trendingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  trendingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },

  // People results
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  personSub: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Group results
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  groupThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  groupSub: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Event results
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  eventIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(74,144,164,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  eventDate: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // See all
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.secondary,
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
