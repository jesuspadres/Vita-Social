import React, { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Sparkles, X } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiIcebreakerProps {
  /** Shared interests between the two users */
  sharedInterests: string[];
  /** Callback when a conversation prompt is selected */
  onSelectPrompt: (prompt: string) => void;
  /** Mode: "new" for first conversations (default), "rekindle" for stale ones */
  mode?: "new" | "rekindle";
}

// ---------------------------------------------------------------------------
// Interest → Prompt mapping
// ---------------------------------------------------------------------------

const interestPrompts: Record<string, string> = {
  hiking: "What's the best trail you've been on recently?",
  photography: "What's your favorite subject to photograph?",
  coffee: "Favorite coffee spot in town? I'm always looking for new ones!",
  art: "Seen any good art exhibitions lately?",
  music: "What's the last concert you went to?",
  cooking: "What's your signature dish?",
  yoga: "How long have you been practicing yoga?",
  reading: "What book are you reading right now?",
  travel: "What's the most memorable place you've traveled to?",
  dance: "What style of dance do you love most?",
  climbing: "Indoor or outdoor climbing -- what's your preference?",
  running: "Are you training for anything right now?",
  painting: "What medium do you work with most?",
  film: "Seen any great movies lately?",
  basketball: "Do you play pickup or watch more?",
  gaming: "What's your go-to game right now?",
  jazz: "Who's your favorite jazz artist?",
  wine: "Red or white -- where do you stand?",
  writing: "What kind of writing do you enjoy?",
  "board games": "What's your all-time favorite board game?",
  dogs: "Do you have a dog? What kind?",
  surfing: "What's the best wave you've ever caught?",
};

const fallbackPrompts = [
  "What's something you're excited about right now?",
  "If you could have dinner with anyone, who would it be?",
  "What's the best thing that happened to you this week?",
];

const rekindlePrompts = [
  "It's been a while — what's the best thing that happened to you this week?",
  "I was just thinking about our chat. What have you been up to?",
  "Life got busy, but I'd love to keep talking. What's new with you?",
  "Ready to actually meet up? What's your schedule like this week?",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiIcebreaker({
  sharedInterests,
  onSelectPrompt,
  mode = "new",
}: AiIcebreakerProps) {
  const [dismissed, setDismissed] = useState(false);

  const prompts = useMemo(() => {
    // Rekindle mode: show conversation restart prompts
    if (mode === "rekindle") {
      return rekindlePrompts.slice(0, 4);
    }

    // New conversation mode: interest-based + fallbacks
    const matched: string[] = [];

    for (const interest of sharedInterests) {
      const key = interest.toLowerCase();
      if (interestPrompts[key] && matched.length < 3) {
        matched.push(interestPrompts[key]);
      }
    }

    // Fill remaining slots with fallbacks
    let fallbackIdx = 0;
    while (matched.length < 3 && fallbackIdx < fallbackPrompts.length) {
      if (!matched.includes(fallbackPrompts[fallbackIdx])) {
        matched.push(fallbackPrompts[fallbackIdx]);
      }
      fallbackIdx++;
    }

    return matched;
  }, [sharedInterests, mode]);

  if (dismissed) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify().damping(16)}
      style={styles.container}
    >
      {/* Dismiss button */}
      <Pressable
        onPress={() => setDismissed(true)}
        style={styles.dismissButton}
        hitSlop={8}
      >
        <X size={16} color="#6B7280" />
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Sparkles size={18} color="#4A90A4" />
        <Text style={styles.headerText}>
          {mode === "rekindle" ? "Pick up where you left off" : "AI Wingman suggests"}
        </Text>
      </View>

      {/* Prompts */}
      {prompts.map((prompt, idx) => (
        <Animated.View
          key={prompt}
          entering={FadeInDown.delay(150 + idx * 100)
            .duration(300)
            .springify()
            .damping(16)}
        >
          <Pressable
            onPress={() => onSelectPrompt(prompt)}
            style={({ pressed }) => [
              styles.promptChip,
              pressed && styles.promptChipPressed,
            ]}
          >
            <Text style={styles.promptText}>{prompt}</Text>
          </Pressable>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

AiIcebreaker.displayName = "AiIcebreaker";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(74, 144, 164, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
    position: "relative",
  },
  dismissButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    paddingRight: 24,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A7487",
    fontFamily: "Inter_600SemiBold",
  },
  promptChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 164, 0.15)",
    minHeight: 44,
    justifyContent: "center",
  },
  promptChipPressed: {
    backgroundColor: "rgba(74, 144, 164, 0.06)",
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#374151",
    fontFamily: "Inter_400Regular",
  },
});
