import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  Dimensions,
  StyleSheet,
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
import * as Haptics from "expo-haptics";
import { MessageCircle, ArrowRight } from "lucide-react-native";
import { CURRENT_USER_PROFILE, type DiscoverUser } from "@/lib/mock-data";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CONFETTI_COUNT = 18;
const BURST_COUNT = 4;
const CONFETTI_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.goldBadge,
  COLORS.blueBadge,
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchCelebrationProps {
  /** The matched user to celebrate */
  matchedUser: DiscoverUser;
  /** Called when user taps "Send a message" */
  onSendMessage: () => void;
  /** Called when user taps "Keep discovering" */
  onKeepDiscovering: () => void;
}

// ---------------------------------------------------------------------------
// Confetti Particle
// ---------------------------------------------------------------------------

interface ConfettiPiece {
  id: number;
  color: string;
  startX: number;
  startY: number;
  driftX: number;
  rotation: number;
  delay: number;
  size: number;
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2,
    startY: -20 - Math.random() * 60,
    driftX: (Math.random() - 0.5) * 120,
    rotation: Math.random() * 360,
    delay: Math.random() * 600,
    size: 8 + Math.random() * 6,
  }));
}

function ConfettiPieceView({ piece }: { piece: ConfettiPiece }) {
  const translateY = useSharedValue(piece.startY);
  const translateX = useSharedValue(piece.startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      piece.delay,
      withTiming(500, { duration: 2200, easing: Easing.in(Easing.quad) }),
    );
    translateX.value = withDelay(
      piece.delay,
      withTiming(piece.startX + piece.driftX, { duration: 2200 }),
    );
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: 2200,
      }),
    );
    opacity.value = withDelay(
      piece.delay + 1500,
      withTiming(0, { duration: 700 }),
    );
  }, [translateY, translateX, rotate, opacity, piece]);

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
          borderRadius: 2,
          left: SCREEN_WIDTH / 2,
          top: "40%",
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

// ---------------------------------------------------------------------------
// Radial Burst Ring
// ---------------------------------------------------------------------------

function BurstRing({ index }: { index: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const delay = 100 + index * 120;
    scale.value = withDelay(delay, withTiming(3, { duration: 800, easing: Easing.out(Easing.quad) }));
    opacity.value = withDelay(delay, withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) }));
  }, [scale, opacity, index]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 2,
          borderColor: COLORS.secondary,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MatchCelebration({
  matchedUser,
  onSendMessage,
  onKeepDiscovering,
}: MatchCelebrationProps) {
  const confettiPieces = useMemo(() => generateConfetti(), []);

  // Photo bounce-in animations
  const leftPhotoScale = useSharedValue(0);
  const rightPhotoScale = useSharedValue(0);
  const headerScale = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(20);

  useEffect(() => {
    // Heavy impact on appear
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Photos bounce in
    leftPhotoScale.value = withDelay(
      100,
      withSpring(1, { damping: 10, stiffness: 150, mass: 0.8 }),
    );
    rightPhotoScale.value = withDelay(
      250,
      withSpring(1, { damping: 10, stiffness: 150, mass: 0.8 }),
    );

    // Header spring in
    headerScale.value = withDelay(
      400,
      withSpring(1, { damping: 12, stiffness: 120 }),
    );
    headerOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 300 }),
    );

    // Success haptic after photos
    const hapticTimer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 500);

    // CTAs fade in
    ctaOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    ctaTranslateY.value = withDelay(
      700,
      withSpring(0, { damping: 15, stiffness: 120 }),
    );

    return () => clearTimeout(hapticTimer);
  }, [
    leftPhotoScale,
    rightPhotoScale,
    headerScale,
    headerOpacity,
    ctaOpacity,
    ctaTranslateY,
  ]);

  const leftPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leftPhotoScale.value }],
  }));

  const rightPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rightPhotoScale.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onKeepDiscovering}
    >
      <View style={celebStyles.overlay}>
        {/* Radial burst rings */}
        <View style={celebStyles.burstContainer}>
          {Array.from({ length: BURST_COUNT }, (_, i) => (
            <BurstRing key={i} index={i} />
          ))}
        </View>

        {/* Confetti */}
        {confettiPieces.map((piece) => (
          <ConfettiPieceView key={piece.id} piece={piece} />
        ))}

        {/* Content card */}
        <View style={celebStyles.content}>
          {/* User photos side by side */}
          <View style={celebStyles.photosRow}>
            <Animated.View style={[celebStyles.photoWrapper, leftPhotoStyle]}>
              <Image
                source={{ uri: CURRENT_USER_PROFILE.avatarUrl }}
                style={celebStyles.photo}
                resizeMode="cover"
              />
            </Animated.View>

            <Animated.View style={[celebStyles.photoWrapper, celebStyles.photoRight, rightPhotoStyle]}>
              <Image
                source={{ uri: matchedUser.avatar_url ?? undefined }}
                style={celebStyles.photo}
                resizeMode="cover"
              />
            </Animated.View>
          </View>

          {/* Header */}
          <Animated.View style={headerStyle}>
            <Text style={celebStyles.heading}>It's a connection!</Text>
            <Text style={celebStyles.subheading}>
              You and {matchedUser.first_name} liked each other
            </Text>
          </Animated.View>

          {/* CTAs */}
          <Animated.View style={[celebStyles.ctaContainer, ctaStyle]}>
            {/* Primary: Send a message */}
            <Pressable
              style={celebStyles.primaryCta}
              onPress={onSendMessage}
            >
              <MessageCircle size={18} color="#FFFFFF" />
              <Text style={celebStyles.primaryCtaText}>Send a message</Text>
            </Pressable>

            {/* Secondary: Keep discovering */}
            <Pressable
              style={celebStyles.secondaryCta}
              onPress={onKeepDiscovering}
            >
              <Text style={celebStyles.secondaryCtaText}>Keep discovering</Text>
              <ArrowRight size={16} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

MatchCelebration.displayName = "MatchCelebration";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const celebStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  burstContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: "35%",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  photosRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  photoRight: {
    marginLeft: -20,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  subheading: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    marginBottom: 32,
  },
  ctaContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    maxWidth: 300,
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  secondaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  secondaryCtaText: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_500Medium",
  },
});
