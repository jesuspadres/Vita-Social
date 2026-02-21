import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  FadeInUp,
} from "react-native-reanimated";
import { Star, Check } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Benefits list
// ---------------------------------------------------------------------------

const GOLD_BENEFITS = [
  "Unlimited Super Likes",
  "See who viewed your profile",
  "Super Vouch for friends",
  "Priority in discovery",
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoldUpsellProps {
  onStartTrial?: () => void;
}

// ---------------------------------------------------------------------------
// Animated Shimmer Overlay
// ---------------------------------------------------------------------------

function ShimmerOverlay() {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withDelay(
        1000,
        withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1, // infinite
      false, // no reverse
    );
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => {
    const left = interpolate(translateX.value, [-1, 1], [-100, 400]);
    return {
      transform: [{ translateX: left }],
    };
  });

  return (
    <Animated.View style={[s.shimmerContainer, shimmerStyle]}>
      <LinearGradient
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.15)",
          "rgba(255,255,255,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.shimmerGradient}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoldUpsell({ onStartTrial }: GoldUpsellProps) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(100)}>
      <View style={s.wrapper}>
        <LinearGradient
          colors={["#D4AF37", "#C49B2A", "#B8860B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.gradientBg}
        >
          {/* Shimmer effect */}
          <View style={s.shimmerClip}>
            <ShimmerOverlay />
          </View>

          {/* Subtle highlight overlay */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.2)",
              "transparent",
              "rgba(0,0,0,0.1)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.overlayGradient}
          />

          {/* Content */}
          <View style={s.content}>
            {/* Header */}
            <View style={s.headerRow}>
              <View style={s.iconCircle}>
                <Star size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.5} />
              </View>
              <View>
                <Text style={s.heading}>Vita Gold</Text>
                <Text style={s.subheading}>Unlock premium features</Text>
              </View>
            </View>

            {/* Benefits */}
            <View style={s.benefitsList}>
              {GOLD_BENEFITS.map((benefit) => (
                <View key={benefit} style={s.benefitRow}>
                  <View style={s.benefitCheckCircle}>
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={s.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Price */}
            <Text style={s.priceText}>$9.99/month after free trial</Text>

            {/* CTA Button */}
            <Pressable
              onPress={onStartTrial}
              style={({ pressed }) => [
                s.ctaButton,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[COLORS.primary, "#2A6B7C", COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.ctaGradient}
              >
                <Text style={s.ctaText}>Start Free Trial</Text>
              </LinearGradient>
            </Pressable>

            {/* Fine print */}
            <Text style={s.finePrint}>
              7-day free trial. Cancel anytime.
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

GoldUpsell.displayName = "GoldUpsell";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientBg: {
    position: "relative",
    padding: 20,
    overflow: "hidden",
  },
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  shimmerClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmerContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },

  // Content
  content: {
    position: "relative",
    zIndex: 10,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_500Medium",
    marginTop: 1,
  },

  // Benefits
  benefitsList: {
    marginBottom: 20,
    gap: 8,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.95)",
    fontFamily: "Inter_500Medium",
  },

  // Price
  priceText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },

  // CTA
  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    minHeight: 48,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },

  // Fine print
  finePrint: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
});
