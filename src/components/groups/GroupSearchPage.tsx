import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Search, Lock, Users } from "lucide-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

const CATEGORIES = [
  "All",
  "Outdoors",
  "Music",
  "Food & Drink",
  "Fitness",
  "Arts",
  "Tech",
  "Social",
] as const;

type Category = (typeof CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchGroup {
  id: string;
  name: string;
  members: number;
  category: string;
  privacy: "public" | "private";
  healthColor: string;
  coverImage: string;
}

export interface GroupSearchPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const SEARCH_GROUPS: SearchGroup[] = [
  {
    id: "gs-1",
    name: "Trail Runners ATX",
    members: 156,
    category: "Outdoors",
    privacy: "public",
    healthColor: "#38A169",
    coverImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=240&fit=crop",
  },
  {
    id: "gs-2",
    name: "Jazz After Dark",
    members: 89,
    category: "Music",
    privacy: "public",
    healthColor: "#D69E2E",
    coverImage: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=240&fit=crop",
  },
  {
    id: "gs-3",
    name: "Coffee Connoisseurs",
    members: 234,
    category: "Food & Drink",
    privacy: "public",
    healthColor: "#38A169",
    coverImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=240&fit=crop",
  },
  {
    id: "gs-4",
    name: "Sunrise Yoga Collective",
    members: 67,
    category: "Fitness",
    privacy: "private",
    healthColor: "#38A169",
    coverImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=240&fit=crop",
  },
  {
    id: "gs-5",
    name: "Board Game Nights",
    members: 45,
    category: "Social",
    privacy: "public",
    healthColor: "#E53E3E",
    coverImage: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=240&fit=crop",
  },
  {
    id: "gs-6",
    name: "Austin Photography Club",
    members: 112,
    category: "Arts",
    privacy: "public",
    healthColor: "#38A169",
    coverImage: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=240&fit=crop",
  },
];

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function GroupResultCard({ group }: { group: SearchGroup }) {
  const [joined, setJoined] = useState(false);

  return (
    <View style={s.card}>
      <Image
        source={{ uri: group.coverImage }}
        style={s.cardCover}
        resizeMode="cover"
      />
      <View style={s.cardBody}>
        <Text style={s.cardName} numberOfLines={1}>
          {group.name}
        </Text>
        <View style={s.cardMeta}>
          <View style={s.cardMetaItem}>
            <Users size={12} color="#6B7280" />
            <Text style={s.cardMetaText}>{group.members} members</Text>
          </View>
          {group.privacy === "private" && (
            <View style={s.privacyBadge}>
              <Lock size={10} color="#6B7280" />
              <Text style={s.privacyText}>Private</Text>
            </View>
          )}
        </View>
        <View style={s.cardBottom}>
          <View style={s.healthDotRow}>
            <View style={[s.healthDot, { backgroundColor: group.healthColor }]} />
            <Text style={s.healthLabel}>Health</Text>
          </View>
          <Button
            size="sm"
            variant={joined ? "ghost" : "secondary"}
            onPress={() => setJoined((p) => !p)}
          >
            {joined ? "Joined" : "Join"}
          </Button>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GroupSearchPage({ onClose }: GroupSearchPageProps) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

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

  const handleClose = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
    setTimeout(onClose, 260);
  }, [translateX, onClose]);

  // Filtered results
  const filteredGroups = useMemo(() => {
    let groups = SEARCH_GROUPS;

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      groups = groups.filter((g) => g.name.toLowerCase().includes(query));
    }

    if (selectedCategory !== "All") {
      groups = groups.filter((g) => g.category === selectedCategory);
    }

    return groups;
  }, [searchText, selectedCategory]);

  const renderItem = useCallback(
    ({ item }: { item: SearchGroup }) => <GroupResultCard group={item} />,
    [],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[s.overlay, slideStyle]}>
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={handleClose}
            hitSlop={8}
            style={s.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color="#111827" />
          </Pressable>
          <Text style={s.headerTitle}>Explore Groups</Text>
          <View style={s.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search groups..."
            placeholderTextColor="#9CA3AF"
            style={s.searchInput}
          />
        </View>

        {/* Category Filter Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  s.categoryPill,
                  isSelected && s.categoryPillSelected,
                ]}
              >
                <Text
                  style={[
                    s.categoryPillText,
                    isSelected && s.categoryPillTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Results Grid */}
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={s.emptyTitle}>No groups found</Text>
              <Text style={s.emptyDesc}>
                Try a different search or category
              </Text>
            </View>
          }
        />
      </Animated.View>
    </GestureDetector>
  );
}

GroupSearchPage.displayName = "GroupSearchPage";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 50,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
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
  headerSpacer: {
    width: 44,
  },

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    minHeight: 48,
  },

  // Category Pills
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter_500Medium",
  },
  categoryPillTextSelected: {
    color: "#FFFFFF",
  },

  // Results List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardCover: {
    width: "100%",
    height: 120,
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  privacyText: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  healthDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  healthLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
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
