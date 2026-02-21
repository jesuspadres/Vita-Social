import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal as RNModal,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  SlideInDown,
  SlideOutDown,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import {
  Sparkles,
  X,
  RefreshCw,
  Smile,
  Heart,
  MessageCircle,
  Compass,
  Shuffle,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiIcebreakerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectSuggestion: (text: string) => void;
  userName: string;
}

type Category = "Fun" | "Deep" | "Flirty" | "Activity" | "Random";

interface IcebreakerItem {
  text: string;
  id: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const ICEBREAKER_DATA: Record<Category, string[]> = {
  Fun: [
    "If you could only eat one cuisine for the rest of your life, what would it be?",
    "What's the most spontaneous thing you've ever done?",
    "Would you rather be able to fly or read minds?",
  ],
  Deep: [
    "What's something you believe that most people don't?",
    "If you could have dinner with anyone in history, who?",
    "What's a lesson that took you a long time to learn?",
  ],
  Flirty: [
    "What's your idea of a perfect first date?",
    "What's the most attractive quality someone can have?",
    "Are you more of a morning person or a night owl?",
  ],
  Activity: [
    "Want to check out that new coffee shop downtown?",
    "There's a hiking trail I've been wanting to try — interested?",
    "Have you been to any good concerts lately?",
  ],
  Random: [
    "What's the last thing you watched that you couldn't stop thinking about?",
    "If you could teleport anywhere right now, where?",
    "What's your most unpopular opinion?",
  ],
};

const CATEGORIES: Category[] = ["Fun", "Deep", "Flirty", "Activity", "Random"];

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Fun: Smile,
  Deep: MessageCircle,
  Flirty: Heart,
  Activity: Compass,
  Random: Shuffle,
};

const CATEGORY_COLORS: Record<Category, string> = {
  Fun: "#F6AD55",
  Deep: "#4A90A4",
  Flirty: "#E53E3E",
  Activity: "#38A169",
  Random: "#805AD5",
};

// ---------------------------------------------------------------------------
// Shuffle utility
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryPill({
  label,
  selected,
  onPress,
}: {
  label: Category;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.categoryPill,
        selected ? s.categoryPillSelected : s.categoryPillUnselected,
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} category`}
    >
      <Text
        style={[
          s.categoryPillText,
          selected
            ? s.categoryPillTextSelected
            : s.categoryPillTextUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function IcebreakerCard({
  item,
  category,
  onUse,
}: {
  item: IcebreakerItem;
  category: Category;
  onUse: () => void;
}) {
  const Icon = CATEGORY_ICONS[category];
  const iconColor = CATEGORY_COLORS[category];

  return (
    <View style={s.card}>
      <View style={s.cardBody}>
        <View style={[s.cardIconCircle, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={16} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={s.cardText}>{item.text}</Text>
      </View>
      <View style={s.cardFooter}>
        <Pressable
          onPress={onUse}
          style={({ pressed }) => [
            s.useButton,
            pressed && { opacity: 0.7 },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Use this icebreaker: ${item.text}`}
        >
          <Text style={s.useButtonText}>Use this</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AiIcebreakerSheet({
  visible,
  onClose,
  onSelectSuggestion,
  userName,
}: AiIcebreakerSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<Category>("Fun");
  const [refreshKey, setRefreshKey] = useState(0);

  const items = useMemo((): IcebreakerItem[] => {
    const texts = ICEBREAKER_DATA[selectedCategory];
    const shuffled = refreshKey > 0 ? shuffleArray(texts) : texts;
    return shuffled.map((text, idx) => ({
      text,
      id: `${selectedCategory}-${idx}-${refreshKey}`,
    }));
  }, [selectedCategory, refreshKey]);

  const handleUse = useCallback(
    (text: string) => {
      onSelectSuggestion(text);
      onClose();
    },
    [onSelectSuggestion, onClose],
  );

  const handleRegenerate = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={s.backdrop}
      >
        <Pressable style={s.backdropPress} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(300)}
        style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {/* Drag Handle */}
        <View style={s.dragHandle}>
          <View style={s.dragBar} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Sparkles size={20} color={COLORS.secondary} strokeWidth={2} />
            <Text style={s.headerTitle}>AI Icebreakers</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={s.closeBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close icebreakers"
          >
            <X size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoryRow}
          style={s.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>

        {/* Icebreaker Cards */}
        <ScrollView
          style={s.cardList}
          contentContainerStyle={s.cardListContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <IcebreakerCard
              key={item.id}
              item={item}
              category={selectedCategory}
              onUse={() => handleUse(item.text)}
            />
          ))}
        </ScrollView>

        {/* Regenerate Button */}
        <View style={s.regenerateRow}>
          <Pressable
            onPress={handleRegenerate}
            style={({ pressed }) => [
              s.regenerateBtn,
              pressed && { opacity: 0.7 },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Regenerate icebreakers"
          >
            <RefreshCw size={16} color={COLORS.secondary} strokeWidth={2} />
            <Text style={s.regenerateBtnText}>Regenerate</Text>
          </Pressable>
        </View>
      </Animated.View>
    </RNModal>
  );
}

AiIcebreakerSheet.displayName = "AiIcebreakerSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  backdropPress: {
    flex: 1,
  },

  // Sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },

  // Drag Handle
  dragHandle: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
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
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  // Category Tabs
  categoryScroll: {
    flexGrow: 0,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryPillSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  categoryPillUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  categoryPillTextSelected: {
    color: "#FFFFFF",
  },
  categoryPillTextUnselected: {
    color: "#374151",
  },

  // Card List
  cardList: {
    maxHeight: 340,
  },
  cardListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardBody: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  cardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  useButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  useButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.secondary,
    fontFamily: "Inter_600SemiBold",
  },

  // Regenerate
  regenerateRow: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 4,
  },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    minHeight: 44,
  },
  regenerateBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.secondary,
    fontFamily: "Inter_600SemiBold",
  },
});
