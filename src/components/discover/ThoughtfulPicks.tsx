import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  ShieldCheck,
  Sparkles,
  Clock,
  Heart,
  X,
} from "lucide-react-native";
import { dailyPicks, getAge, type DailyPick } from "@/lib/mock-data";
import { TrustThermometer } from "@/components/ui/trust-thermometer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = 280;

const CHIP_COLORS = ["#4A90A4", "#38A169", "#D69E2E", "#3182CE", "#E53E3E"];

// ---------------------------------------------------------------------------
// ThoughtfulPicks
// ---------------------------------------------------------------------------

export function ThoughtfulPicks() {
  // Track which picks have been reviewed (passed or started conversation)
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const markReviewed = (userId: string) => {
    setReviewedIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

  const unreviewedPicks = dailyPicks.filter(
    (pick) => !reviewedIds.has(pick.user.id),
  );

  const allReviewed = unreviewedPicks.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(400).delay(100)}>
        <Text style={styles.headerTitle}>Your Daily Picks</Text>
        <Text style={styles.headerSubtitle}>
          Curated just for you based on shared interests and community
        </Text>
      </Animated.View>

      {/* Pick Cards */}
      {unreviewedPicks.map((pick, index) => (
        <PickCard
          key={pick.user.id}
          pick={pick}
          index={index}
          onStartConversation={() => markReviewed(pick.user.id)}
          onPass={() => markReviewed(pick.user.id)}
        />
      ))}

      {/* End State */}
      {allReviewed && (
        <Animated.View
          entering={FadeInUp.duration(500).delay(200)}
          style={styles.endStateCard}
        >
          <View style={styles.endStateIconCircle}>
            <Clock size={32} color="#4A90A4" />
          </View>
          <Text style={styles.endStateTitle}>That's it for today</Text>
          <Text style={styles.endStateDescription}>
            Your next picks arrive tomorrow at 9 AM.{"\n"}Quality over quantity.
          </Text>
        </Animated.View>
      )}

      {/* Bottom spacer for tab bar clearance */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// PickCard
// ---------------------------------------------------------------------------

interface PickCardProps {
  pick: DailyPick;
  index: number;
  onStartConversation: () => void;
  onPass: () => void;
}

function PickCard({ pick, index, onStartConversation, onPass }: PickCardProps) {
  const { user, matchReason } = pick;
  const age = getAge(user.birthdate);

  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(200 + index * 150)}
      style={styles.pickCard}
    >
      {/* Photo */}
      <Image
        source={{ uri: user.avatar_url ?? undefined }}
        style={styles.pickPhoto}
        resizeMode="cover"
      />

      {/* Info */}
      <View style={styles.pickInfo}>
        {/* Name + Verification */}
        <View style={styles.pickNameRow}>
          <Text style={styles.pickName}>
            {user.first_name}, {age}
          </Text>
          {user.verification_level !== "none" && (
            <ShieldCheck size={18} color="#3182CE" style={{ marginLeft: 6 }} />
          )}
        </View>

        {/* Distance */}
        <Text style={styles.pickDistance}>{user.distance}</Text>

        {/* Trust Thermometer */}
        <View style={styles.pickTrustRow}>
          <TrustThermometer
            levels={{
              phone: true,
              photo:
                user.verification_level === "photo" ||
                user.verification_level === "id",
              id: user.verification_level === "id",
              eventsAttended: user.eventsAttended ?? 0,
            }}
          />
        </View>

        {/* Interests */}
        {user.interests.length > 0 && (
          <View style={styles.pickChipContainer}>
            {user.interests.slice(0, 4).map((interest, i) => (
              <View
                key={interest}
                style={[
                  styles.pickChip,
                  {
                    backgroundColor: `${CHIP_COLORS[i % CHIP_COLORS.length]}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pickChipText,
                    { color: CHIP_COLORS[i % CHIP_COLORS.length] },
                  ]}
                >
                  {interest}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Why Vita picked this */}
        <View style={styles.whySection}>
          <View style={styles.whyHeader}>
            <Sparkles size={14} color="#D4AF37" />
            <Text style={styles.whyLabel}>Why Vita picked this</Text>
          </View>
          <Text style={styles.whyText}>{matchReason}</Text>
        </View>

        {/* Actions */}
        <View style={styles.pickActions}>
          <Pressable style={styles.pickPrimaryBtn} onPress={onStartConversation}>
            <Heart size={16} color="#FFFFFF" />
            <Text style={styles.pickPrimaryBtnText}>Start a Conversation</Text>
          </Pressable>

          <Pressable style={styles.pickGhostBtn} onPress={onPass}>
            <X size={16} color="#A0AEC0" />
            <Text style={styles.pickGhostBtnText}>Pass</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  // Header
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
    lineHeight: 20,
  },
  // Pick Card
  pickCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  pickPhoto: {
    width: "100%",
    height: PHOTO_HEIGHT,
  },
  pickInfo: {
    padding: 16,
  },
  pickNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pickName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  pickDistance: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  pickTrustRow: {
    marginBottom: 12,
  },
  // Interest chips
  pickChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  pickChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pickChipText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  // Why section
  whySection: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  whyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  whyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D4AF37",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  whyText: {
    fontSize: 14,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  // Actions
  pickActions: {
    flexDirection: "row",
    gap: 10,
  },
  pickPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#38A169",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    minHeight: 48,
    shadowColor: "#38A169",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  pickPrimaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  pickGhostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
    minHeight: 48,
  },
  pickGhostBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A0AEC0",
    fontFamily: "Inter_500Medium",
  },
  // End state
  endStateCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  endStateIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  endStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  endStateDescription: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});

ThoughtfulPicks.displayName = "ThoughtfulPicks";
