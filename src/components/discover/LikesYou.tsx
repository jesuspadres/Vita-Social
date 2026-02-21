import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Dimensions,
  StyleSheet,
} from "react-native";
import {
  Heart,
  X,
  ChevronDown,
  Sparkles,
  Users,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { discoverLikesYou, getAge, type DiscoverUser } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 12;
const PADDING_H = 16;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - COLUMN_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

type SortOption = "Newest" | "Closest" | "Most Mutual";
const SORT_OPTIONS: SortOption[] = ["Newest", "Closest", "Most Mutual"];

// ---------------------------------------------------------------------------
// LikesYou Component
// ---------------------------------------------------------------------------

export function LikesYou() {
  const [likes, setLikes] = useState<DiscoverUser[]>([...discoverLikesYou]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [sortIndex, setSortIndex] = useState(0);

  const currentSort = SORT_OPTIONS[sortIndex];

  const cycleSortOption = useCallback(() => {
    setSortIndex((prev) => (prev + 1) % SORT_OPTIONS.length);
  }, []);

  const revealCard = useCallback((userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRevealedIds((prev) => new Set(prev).add(userId));
  }, []);

  const handleLike = useCallback((userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLikes((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const handlePass = useCallback((userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikes((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  if (likes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Users size={36} color="#4A90A4" />
        </View>
        <Text style={styles.emptyTitle}>No likes yet</Text>
        <Text style={styles.emptyDescription}>
          Keep swiping -- someone great is bound to like you back!
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{likes.length}</Text>
          </View>
          <Text style={styles.headerTitle}>people like you</Text>
        </View>
        <Pressable style={styles.sortBtn} onPress={cycleSortOption}>
          <Text style={styles.sortText}>{currentSort}</Text>
          <ChevronDown size={16} color="#4A90A4" />
        </Pressable>
      </View>

      {/* Grid */}
      <FlatList
        data={likes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isRevealed = revealedIds.has(item.id);

          return (
            <Pressable
              style={styles.card}
              onPress={() => !isRevealed && revealCard(item.id)}
            >
              {/* Photo */}
              <Image
                source={{ uri: item.avatar_url ?? undefined }}
                style={styles.cardImage}
                blurRadius={isRevealed ? 0 : 20}
                resizeMode="cover"
              />

              {/* Blurred overlay hint */}
              {!isRevealed && (
                <View style={styles.blurOverlay}>
                  <View style={styles.tapHint}>
                    <Heart size={24} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.tapHintText}>Tap to reveal</Text>
                  </View>
                </View>
              )}

              {/* Revealed info */}
              {isRevealed && (
                <View style={styles.revealedInfo}>
                  {/* Info overlay */}
                  <View style={styles.revealedGradient}>
                    <Text style={styles.revealedName}>
                      {item.first_name}, {getAge(item.birthdate)}
                    </Text>
                    {item.shared_interests_count > 0 && (
                      <View style={styles.mutualRow}>
                        <Sparkles size={12} color="#D4AF37" />
                        <Text style={styles.mutualText}>
                          {item.shared_interests_count} mutual
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.cardPassBtn}
                      onPress={() => handlePass(item.id)}
                    >
                      <X size={18} color="#A0AEC0" />
                    </Pressable>
                    <Pressable
                      style={styles.cardLikeBtn}
                      onPress={() => handleLike(item.id)}
                    >
                      <Heart size={18} color="#FFFFFF" fill="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              )}
            </Pressable>
          );
        }}
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
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING_H,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    backgroundColor: "#1A365D",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  countText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4A5568",
    fontFamily: "Inter_500Medium",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F7FAFC",
    minHeight: 44,
  },
  sortText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
  },
  // Grid
  grid: {
    paddingHorizontal: PADDING_H,
    paddingBottom: 100,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  // Blurred overlay
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  tapHint: {
    alignItems: "center",
    gap: 8,
  },
  tapHintText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  // Revealed info
  revealedInfo: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  revealedGradient: {
    paddingHorizontal: 12,
    paddingBottom: 48,
    paddingTop: 40,
    backgroundColor: "transparent",
    // Simulated gradient effect via overlay
    // In production, wrap with LinearGradient
  },
  revealedName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  mutualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  mutualText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_500Medium",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Card action buttons
  cardActions: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardPassBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    minHeight: 44,
  },
  cardLikeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#38A169",
    minHeight: 44,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(74,144,164,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A365D",
    marginBottom: 8,
    fontFamily: "Inter_600SemiBold",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#A0AEC0",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
});

LikesYou.displayName = "LikesYou";
