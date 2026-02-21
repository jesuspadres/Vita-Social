import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolation,
  FadeInUp,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  ThumbsDown,
  ThumbsUp,
  Star,
  Compass,
  ShieldCheck,
  Sparkles,
  MapPinned,
  Users,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { discoverUsers, getAge, type DiscoverUser } from "@/lib/mock-data";
import { ProfileCard } from "@/components/discover/ProfileCard";
import { MatchCelebration } from "@/components/discover/MatchCelebration";
import { TrustThermometer } from "@/components/ui/trust-thermometer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 500;
const SWIPE_OUT_X = SCREEN_WIDTH + 100;

// ---------------------------------------------------------------------------
// SwipeDeck
// ---------------------------------------------------------------------------

export function SwipeDeck() {
  const router = useRouter();
  const [stack, setStack] = useState<DiscoverUser[]>([...discoverUsers]);
  const [expandedUser, setExpandedUser] = useState<DiscoverUser | null>(null);
  const [matchedUser, setMatchedUser] = useState<DiscoverUser | null>(null);

  // Shared values for the top card gesture
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Remove the top card from the stack
  const removeTopCard = useCallback(() => {
    setStack((prev) => prev.slice(1));
    translateX.value = 0;
    translateY.value = 0;
  }, [translateX, translateY]);

  // Swipe right (like) -- may trigger a match celebration
  const swipeRight = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Capture the current top card user before removing
    const swipedUser = stack[0];
    translateX.value = withSpring(SWIPE_OUT_X, { damping: 15, stiffness: 80 }, () => {
      runOnJS(removeTopCard)();
      // Simulate mutual match for users with 3+ shared interests
      if (swipedUser && swipedUser.shared_interests_count >= 3) {
        runOnJS(setMatchedUser)(swipedUser);
      }
    });
  }, [translateX, removeTopCard, stack]);

  // Swipe left (pass)
  const swipeLeft = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateX.value = withSpring(-SWIPE_OUT_X, { damping: 15, stiffness: 80 }, () => {
      runOnJS(removeTopCard)();
    });
  }, [translateX, removeTopCard]);

  // Super-like
  const superLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    translateY.value = withSpring(-SCREEN_HEIGHT, { damping: 15, stiffness: 80 }, () => {
      runOnJS(removeTopCard)();
    });
  }, [translateY, removeTopCard]);

  // Tap gesture — opens expanded profile (only fires if no drag)
  const handleCardTap = useCallback(() => {
    if (stack.length > 0) {
      setExpandedUser(stack[0]);
    }
  }, [stack]);

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleCardTap)();
  });

  // Pan gesture for top card (minDistance prevents accidental activation)
  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const shouldSwipeRight =
        translateX.value > SWIPE_THRESHOLD || event.velocityX > VELOCITY_THRESHOLD;
      const shouldSwipeLeft =
        translateX.value < -SWIPE_THRESHOLD || event.velocityX < -VELOCITY_THRESHOLD;

      if (shouldSwipeRight) {
        runOnJS(swipeRight)();
      } else if (shouldSwipeLeft) {
        runOnJS(swipeLeft)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  // Pan wins if you drag; tap wins if you don't move
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  // Animated style for the top card (rotation + translation)
  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-300, 0, 300],
      [-18, 0, 18],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // LIKE overlay opacity
  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // NOPE overlay opacity
  const nopeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // Second card style (behind top)
  const secondCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.95, 1],
      Extrapolation.CLAMP,
    );
    const ty = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [10, 0],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }, { translateY: ty }],
    };
  });

  // Third card style (behind second)
  const thirdCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.9, 0.95],
      Extrapolation.CLAMP,
    );
    const ty = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [20, 10],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }, { translateY: ty }],
    };
  });

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  if (stack.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {/* Icon */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(100)}
          style={styles.emptyIconCircle}
        >
          <Compass size={36} color="#4A90A4" />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(200)}
          style={styles.emptyTitle}
        >
          You've met everyone nearby!
        </Animated.Text>

        {/* Description */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(300)}
          style={styles.emptyDescription}
        >
          Great work putting yourself out there. Here are some ways to discover more people.
        </Animated.Text>

        {/* Primary CTA -- Expand Your Radius */}
        <Animated.View entering={FadeInUp.duration(500).delay(450)}>
          <Pressable
            style={styles.emptyPrimaryCta}
            onPress={() => {
              router.push("/(main)/(tabs)/profile");
            }}
          >
            <MapPinned size={18} color="#FFFFFF" />
            <Text style={styles.emptyPrimaryCtaText}>Expand Your Radius</Text>
          </Pressable>
        </Animated.View>

        {/* Secondary CTA -- Join a Group */}
        <Animated.View entering={FadeInUp.duration(500).delay(600)}>
          <Pressable
            style={styles.emptySecondaryCta}
            onPress={() => {
              router.push("/(main)/(tabs)/groups");
            }}
          >
            <Users size={18} color="#4A90A4" />
            <Text style={styles.emptySecondaryCtaText}>
              Join a Group to Meet More People
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Only render up to 3 cards for the stack
  const visibleCards = stack.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Card Stack */}
      <View style={styles.cardStack}>
        {visibleCards
          .slice()
          .reverse()
          .map((user, reverseIndex) => {
            const index = visibleCards.length - 1 - reverseIndex;
            const isTop = index === 0;
            const isSecond = index === 1;

            // Determine animation style
            const animStyle = isTop
              ? topCardStyle
              : isSecond
                ? secondCardStyle
                : thirdCardStyle;

            // Static fallback for behind cards when fewer than 3
            const staticStyle = !isTop
              ? {
                  transform: [
                    { scale: isSecond ? 0.95 : 0.9 },
                    { translateY: isSecond ? 10 : 20 },
                  ],
                }
              : undefined;

            const cardContent = (
              <Animated.View
                key={user.id}
                style={[
                  styles.card,
                  { zIndex: visibleCards.length - index },
                  animStyle,
                  !isTop && staticStyle,
                ]}
                pointerEvents={isTop ? "auto" : "none"}
                accessible={isTop}
                accessibilityLabel={
                  isTop
                    ? `${user.first_name}, ${getAge(user.birthdate)}, ${user.distance} away, ${user.verification_level !== "none" ? "verified" : "not verified"}`
                    : undefined
                }
              >
                {/* Card Image */}
                <View style={styles.cardInner}>
                  <Image
                    source={{ uri: user.avatar_url ?? undefined }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />

                  {/* Gradient Overlay */}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardInfo}>
                      {/* Name + Age */}
                      <View style={styles.nameRow}>
                        <Text style={styles.cardName}>
                          {user.first_name},{" "}
                          {getAge(user.birthdate)}
                        </Text>
                        {user.verification_level !== "none" && (
                          <ShieldCheck
                            size={18}
                            color="#3182CE"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </View>

                      {/* Distance */}
                      <Text style={styles.cardDistance}>{user.distance}</Text>

                      {/* Shared Interests */}
                      {user.shared_interests_count > 0 && (
                        <View style={styles.interestsRow}>
                          <Sparkles size={14} color="#D4AF37" />
                          <Text style={styles.interestsText}>
                            {user.shared_interests_count} shared interests
                          </Text>
                        </View>
                      )}

                      {/* Trust Thermometer (compact) */}
                      <View style={styles.trustThermometerRow}>
                        <TrustThermometer
                          levels={{
                            phone: true,
                            photo: user.verification_level === "photo" || user.verification_level === "id",
                            id: user.verification_level === "id",
                            eventsAttended: user.eventsAttended ?? 0,
                          }}
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* LIKE Overlay */}
                {isTop && (
                  <Animated.View
                    style={[styles.stampContainer, styles.stampLeft, likeOverlayStyle]}
                    pointerEvents="none"
                  >
                    <View style={[styles.stamp, styles.stampLike]}>
                      <Text style={styles.stampLikeText}>LIKE</Text>
                    </View>
                  </Animated.View>
                )}

                {/* NOPE Overlay */}
                {isTop && (
                  <Animated.View
                    style={[styles.stampContainer, styles.stampRight, nopeOverlayStyle]}
                    pointerEvents="none"
                  >
                    <View style={[styles.stamp, styles.stampNope]}>
                      <Text style={styles.stampNopeText}>NOPE</Text>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            );

            // Only wrap the top card in GestureDetector
            if (isTop) {
              return (
                <GestureDetector key={user.id} gesture={composedGesture}>
                  {cardContent}
                </GestureDetector>
              );
            }

            return cardContent;
          })}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Pass */}
        <Pressable
          style={[styles.actionBtn, styles.passBtn]}
          onPress={swipeLeft}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Pass on ${stack[0]?.first_name ?? "user"}`}
          accessibilityHint="Swipe left to pass"
        >
          <ThumbsDown size={26} color="#A0AEC0" />
        </Pressable>

        {/* Super Like */}
        <Pressable
          style={[styles.actionBtn, styles.superBtn]}
          onPress={superLike}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Super like ${stack[0]?.first_name ?? "user"}`}
          accessibilityHint="Send a super like"
        >
          <Star size={28} color="#FFFFFF" fill="#FFFFFF" />
        </Pressable>

        {/* Like */}
        <Pressable
          style={[styles.actionBtn, styles.likeBtn]}
          onPress={swipeRight}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Like ${stack[0]?.first_name ?? "user"}`}
          accessibilityHint="Swipe right to like"
        >
          <ThumbsUp size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Profile Card Modal */}
      {expandedUser && (
        <ProfileCard
          user={expandedUser}
          onClose={() => setExpandedUser(null)}
          onLike={() => {
            setExpandedUser(null);
            swipeRight();
          }}
          onPass={() => {
            setExpandedUser(null);
            swipeLeft();
          }}
        />
      )}

      {/* Match Celebration Overlay */}
      {matchedUser && (
        <MatchCelebration
          matchedUser={matchedUser}
          onSendMessage={() => {
            setMatchedUser(null);
            router.push("/(main)/(tabs)/messages");
          }}
          onKeepDiscovering={() => setMatchedUser(null)}
        />
      )}
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
  cardStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 12,
    right: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cardInner: {
    flex: 1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  cardInfo: {
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  cardDistance: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
  interestsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  interestsText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
  },
  trustThermometerRow: {
    marginTop: 6,
    opacity: 0.9,
  },
  // LIKE / NOPE stamps
  stampContainer: {
    position: "absolute",
    top: 40,
  },
  stampLeft: {
    left: 20,
  },
  stampRight: {
    right: 20,
  },
  stamp: {
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: "-15deg" }],
  },
  stampLike: {
    borderColor: "#38A169",
  },
  stampLikeText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#38A169",
    fontFamily: "Inter_800ExtraBold",
  },
  stampNope: {
    borderColor: "#E53E3E",
    transform: [{ rotate: "15deg" }],
  },
  stampNopeText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#E53E3E",
    fontFamily: "Inter_800ExtraBold",
  },
  // Action buttons
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  passBtn: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  superBtn: {
    backgroundColor: "#D69E2E",
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  likeBtn: {
    backgroundColor: "#38A169",
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
    backgroundColor: "rgba(74, 144, 164, 0.1)",
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
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyPrimaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A365D",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    gap: 8,
    marginBottom: 12,
    minHeight: 48,
    shadowColor: "#1A365D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyPrimaryCtaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  emptySecondaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    gap: 8,
    minHeight: 48,
  },
  emptySecondaryCtaText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
  },
});

SwipeDeck.displayName = "SwipeDeck";
