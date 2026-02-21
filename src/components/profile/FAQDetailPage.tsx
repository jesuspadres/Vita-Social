import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
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
  ThumbsUp,
  ThumbsDown,
} from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FAQDetailPageProps {
  onClose: () => void;
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function FAQDetailPage({ onClose, question, answer }: FAQDetailPageProps) {
  const insets = useSafeAreaInsets();

  // Feedback state: null = not voted, "yes" = helpful, "no" = not helpful
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

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
            <Text style={s.headerTitle}>Help Center</Text>
            <View style={s.headerSpacer} />
          </View>

          {/* Body */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 40 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Question */}
            <Text style={s.questionText}>{question}</Text>

            {/* Answer */}
            <Text style={s.answerText}>{answer}</Text>

            {/* Was this helpful? */}
            <View style={s.feedbackSection}>
              <Text style={s.feedbackTitle}>Was this helpful?</Text>

              <View style={s.feedbackRow}>
                {/* Thumbs up */}
                <Pressable
                  onPress={() => {
                    if (feedback === null) setFeedback("yes");
                  }}
                  disabled={feedback !== null}
                  style={[
                    s.feedbackBtn,
                    feedback === "yes" && s.feedbackBtnYes,
                    feedback !== null && feedback !== "yes" && s.feedbackBtnDisabled,
                  ]}
                >
                  <ThumbsUp
                    size={16}
                    color={feedback === "yes" ? "#FFFFFF" : "#718096"}
                    strokeWidth={1.75}
                  />
                  <Text
                    style={[
                      s.feedbackBtnText,
                      feedback === "yes" && s.feedbackBtnTextSelected,
                    ]}
                  >
                    Yes
                  </Text>
                </Pressable>

                {/* Thumbs down */}
                <Pressable
                  onPress={() => {
                    if (feedback === null) setFeedback("no");
                  }}
                  disabled={feedback !== null}
                  style={[
                    s.feedbackBtn,
                    feedback === "no" && s.feedbackBtnNo,
                    feedback !== null && feedback !== "no" && s.feedbackBtnDisabled,
                  ]}
                >
                  <ThumbsDown
                    size={16}
                    color={feedback === "no" ? "#FFFFFF" : "#718096"}
                    strokeWidth={1.75}
                  />
                  <Text
                    style={[
                      s.feedbackBtnText,
                      feedback === "no" && s.feedbackBtnTextSelected,
                    ]}
                  >
                    No
                  </Text>
                </Pressable>
              </View>

              {/* Thank you message */}
              {feedback !== null && (
                <Text style={s.thankYouText}>
                  Thank you for your feedback!
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

FAQDetailPage.displayName = "FAQDetailPage";

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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: {
    width: 44,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Question
  questionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2D3D",
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
    lineHeight: 24,
  },

  // Answer
  answerText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 40,
  },

  // Feedback section
  feedbackSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 16,
  },
  feedbackRow: {
    flexDirection: "row",
    gap: 12,
  },
  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    minHeight: 44,
  },
  feedbackBtnYes: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  feedbackBtnNo: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  feedbackBtnDisabled: {
    opacity: 0.4,
  },
  feedbackBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#718096",
    fontFamily: "Inter_500Medium",
  },
  feedbackBtnTextSelected: {
    color: "#FFFFFF",
  },
  thankYouText: {
    fontSize: 13,
    color: COLORS.success,
    fontFamily: "Inter_500Medium",
    marginTop: 14,
  },
});
