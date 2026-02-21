import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  AccessibilityInfo,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Check, Users, Share2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { HealthRing } from "@/components/ui/health-ring";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BURST_RING_COUNT = 5;
const CONFETTI_COUNT = 15;
const CONFETTI_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.goldBadge,
  COLORS.blueBadge,
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CheckInSuccessProps {
  visible: boolean;
  eventTitle: string;
  onClose: () => void;
  /** Optional: number of check-ins this month for streak display */
  streakCount?: number;
  /** Optional: days elapsed for health ring display */
  healthDaysElapsed?: number;
  /** Optional: called when user taps "Share this check-in" */
  onShare?: () => void;
}

// ---------------------------------------------------------------------------
// Radial Burst Ring (SVG circle that expands and fades)
// ---------------------------------------------------------------------------

function BurstRing({
  index,
  reduceMotion,
}: {
  index: number;
  reduceMotion: boolean;
}) {
  const scale = useSharedValue(0);
  const ringOpacity = useSharedValue(reduceMotion ? 0 : 0.5);

  useEffect(() => {
    if (reduceMotion) return;
    const staggerDelay = index * 150;
    scale.value = withDelay(
      staggerDelay,
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(3, { duration: 900, easing: Easing.out(Easing.quad) }),
      ),
    );
    ringOpacity.value = withDelay(
      staggerDelay,
      withSequence(
        withTiming(0.5, { duration: 0 }),
        withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) }),
      ),
    );
  }, [scale, ringOpacity, index, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 96,
          height: 96,
          borderRadius: 48,
          borderWidth: 2,
          borderColor: COLORS.success,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

// ---------------------------------------------------------------------------
// Confetti Piece
// ---------------------------------------------------------------------------

interface ConfettiPieceData {
  id: number;
  color: string;
  startX: number;
  driftX: number;
  rotation: number;
  delay: number;
  size: number;
}

function generateConfettiPieces(): ConfettiPieceData[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: (Math.random() - 0.5) * (SCREEN_WIDTH * 0.7),
    driftX: (Math.random() - 0.5) * 100,
    rotation: Math.random() * 360,
    delay: 200 + Math.random() * 500,
    size: 7 + Math.random() * 5,
  }));
}

function ConfettiPiece({
  piece,
  reduceMotion,
}: {
  piece: ConfettiPieceData;
  reduceMotion: boolean;
}) {
  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(piece.startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(reduceMotion ? 0 : 1);

  useEffect(() => {
    if (reduceMotion) return;
    translateY.value = withDelay(
      piece.delay,
      withTiming(350, { duration: 2000, easing: Easing.in(Easing.quad) }),
    );
    translateX.value = withDelay(
      piece.delay,
      withTiming(piece.startX + piece.driftX, { duration: 2000 }),
    );
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + (Math.random() > 0.5 ? 360 : -360), {
        duration: 2000,
      }),
    );
    opacity.value = withDelay(
      piece.delay + 1300,
      withTiming(0, { duration: 700 }),
    );
  }, [translateY, translateX, rotate, opacity, piece, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          borderRadius: 1,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CheckInSuccess({
  visible,
  eventTitle,
  onClose,
  streakCount = 3,
  healthDaysElapsed = 5,
  onShare,
}: CheckInSuccessProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const confettiPieces = useMemo(() => generateConfettiPieces(), []);

  // Check for reduce motion preference
  useEffect(() => {
    const checkMotion = async () => {
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(isReduced);
    };
    checkMotion();

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isReduced: boolean) => setReduceMotion(isReduced),
    );
    return () => subscription.remove();
  }, []);

  // Spring scale for the check circle
  const circleScale = useSharedValue(0);
  // Progress bar width (100% -> 0%)
  const progressWidth = useSharedValue(100);
  // Streak text fade in
  const streakOpacity = useSharedValue(0);
  const streakTranslateY = useSharedValue(10);
  // Health ring opacity
  const healthRingOpacity = useSharedValue(0);
  // Share button
  const shareOpacity = useSharedValue(0);
  // Fade-in fallback for reduce motion
  const cardOpacity = useSharedValue(reduceMotion ? 0 : 1);

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        // Simple fade-in for reduce motion
        cardOpacity.value = withTiming(1, { duration: 400 });
        circleScale.value = withTiming(1, { duration: 300 });
        streakOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
        streakTranslateY.value = 0;
        healthRingOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
        shareOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
      } else {
        cardOpacity.value = 1;

        // Animate circle in
        circleScale.value = withSpring(1, {
          damping: 12,
          stiffness: 120,
          mass: 0.8,
        });

        // Chained haptics: Heavy at 0ms, Success at 500ms
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const hapticTimer = setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 500);

        // Streak text fades in after 1.2s
        streakOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
        streakTranslateY.value = withDelay(
          1200,
          withSpring(0, { damping: 15, stiffness: 120 }),
        );

        // Health ring appears after 800ms
        healthRingOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

        // Share button after 1.5s
        shareOpacity.value = withDelay(1500, withTiming(1, { duration: 400 }));

        // Progress bar countdown over 5 seconds (extended for more content)
        progressWidth.value = 100;
        progressWidth.value = withTiming(0, {
          duration: 5000,
          easing: Easing.linear,
        });

        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
          onClose();
        }, 5000);

        return () => {
          clearTimeout(timer);
          clearTimeout(hapticTimer);
          circleScale.value = 0;
          progressWidth.value = 100;
          streakOpacity.value = 0;
          streakTranslateY.value = 10;
          healthRingOpacity.value = 0;
          shareOpacity.value = 0;
        };
      }

      // Progress bar + auto-dismiss for reduce motion
      if (reduceMotion) {
        progressWidth.value = 100;
        progressWidth.value = withTiming(0, {
          duration: 5000,
          easing: Easing.linear,
        });

        const timer = setTimeout(() => {
          onClose();
        }, 5000);

        return () => {
          clearTimeout(timer);
          circleScale.value = 0;
          progressWidth.value = 100;
          streakOpacity.value = 0;
          healthRingOpacity.value = 0;
          shareOpacity.value = 0;
          cardOpacity.value = 0;
        };
      }
    } else {
      circleScale.value = 0;
      progressWidth.value = 100;
      streakOpacity.value = 0;
      streakTranslateY.value = 10;
      healthRingOpacity.value = 0;
      shareOpacity.value = 0;
      cardOpacity.value = reduceMotion ? 0 : 1;
    }
  }, [
    visible,
    reduceMotion,
    circleScale,
    progressWidth,
    streakOpacity,
    streakTranslateY,
    healthRingOpacity,
    shareOpacity,
    cardOpacity,
    onClose,
  ]);

  const circleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as unknown as number,
  }));

  const streakStyle = useAnimatedStyle(() => ({
    opacity: streakOpacity.value,
    transform: [{ translateY: streakTranslateY.value }],
  }));

  const healthRingStyle = useAnimatedStyle(() => ({
    opacity: healthRingOpacity.value,
  }));

  const shareStyle = useAnimatedStyle(() => ({
    opacity: shareOpacity.value,
  }));

  const cardFadeStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  // Ordinal suffix for streak
  const ordinal = getOrdinal(streakCount);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, cardFadeStyle]}>
          {/* Radial burst rings behind the check circle */}
          {!reduceMotion && (
            <View style={styles.burstContainer}>
              {Array.from({ length: BURST_RING_COUNT }, (_, i) => (
                <BurstRing key={i} index={i} reduceMotion={reduceMotion} />
              ))}
            </View>
          )}

          {/* Confetti */}
          {!reduceMotion && (
            <View style={styles.confettiContainer}>
              {confettiPieces.map((piece) => (
                <ConfettiPiece
                  key={piece.id}
                  piece={piece}
                  reduceMotion={reduceMotion}
                />
              ))}
            </View>
          )}

          {/* Animated Check Circle */}
          <Animated.View style={[styles.circle, circleAnimStyle]}>
            <Check size={48} color="#FFFFFF" strokeWidth={3} />
          </Animated.View>

          {/* Heading */}
          <Text style={styles.heading}>You showed up!</Text>

          {/* Event title */}
          <Text style={styles.eventTitle} numberOfLines={2}>
            {eventTitle}
          </Text>

          {/* Subtext */}
          <Text style={styles.subtext}>This is what Vita is all about.</Text>

          {/* Motivational line */}
          <Text style={styles.motivational}>Real connections happen in person.</Text>

          {/* Health Ring -- briefly fills */}
          <Animated.View style={[styles.healthRingContainer, healthRingStyle]}>
            <HealthRing
              daysElapsed={healthDaysElapsed}
              size={56}
              strokeWidth={3}
            />
          </Animated.View>

          {/* Streak counter */}
          <Animated.View style={streakStyle}>
            <Text style={styles.streakText}>
              {ordinal} check-in this month!
            </Text>
          </Animated.View>

          {/* CTA button */}
          <Pressable style={styles.ctaBtn} onPress={onClose}>
            <Users size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>See who else is here</Text>
          </Pressable>

          {/* Share this check-in */}
          <Animated.View style={shareStyle}>
            <Pressable
              style={styles.shareBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onShare?.();
              }}
            >
              <Share2 size={16} color="#4A90A4" />
              <Text style={styles.shareText}>Share this check-in</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {/* Progress bar at bottom */}
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBarFill, progressStyle]} />
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOrdinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return `${n}${suffix}`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: "center",
    marginHorizontal: 32,
    width: "85%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: "visible",
  },
  burstContainer: {
    position: "absolute",
    top: 40 + 48, // paddingTop + half of circle
    alignItems: "center",
    justifyContent: "center",
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    overflow: "visible",
    zIndex: 10,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#38A169",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#38A169",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 5,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A365D",
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3A7487",
    textAlign: "center",
    marginBottom: 6,
    fontFamily: "Inter_500Medium",
  },
  subtext: {
    fontSize: 14,
    color: "#A0AEC0",
    marginBottom: 4,
    fontFamily: "Inter_400Regular",
  },
  motivational: {
    fontSize: 13,
    color: "#3A7487",
    fontStyle: "italic",
    marginBottom: 16,
    fontFamily: "Inter_400Regular",
  },
  healthRingContainer: {
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.success,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Inter_600SemiBold",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1A365D",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    minHeight: 52,
    shadowColor: "#1A365D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    minHeight: 44,
  },
  shareText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
  },
  // Progress bar
  progressBarContainer: {
    position: "absolute",
    bottom: 80,
    left: 40,
    right: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#38A169",
  },
});

CheckInSuccess.displayName = "CheckInSuccess";
