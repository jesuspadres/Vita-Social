import React, { useState, useEffect, useCallback } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Crown,
  Check,
  Eye,
  Heart,
  Zap,
  BookOpen,
  SlidersHorizontal,
  Ban,
} from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Feature List
// ---------------------------------------------------------------------------

const GOLD_FEATURES = [
  { Icon: Eye, label: "See who likes you" },
  { Icon: Heart, label: "Unlimited likes per day" },
  { Icon: Zap, label: "Priority in discovery" },
  { Icon: BookOpen, label: "Read receipts" },
  { Icon: SlidersHorizontal, label: "Advanced filters" },
  { Icon: Ban, label: "No ads" },
] as const;

// ---------------------------------------------------------------------------
// Plan data
// ---------------------------------------------------------------------------

interface PlanOption {
  id: string;
  label: string;
  pricePerMonth: string;
  totalPrice: string | null;
  badge: string;
  highlighted: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: "monthly",
    label: "Monthly",
    pricePerMonth: "$14.99",
    totalPrice: null,
    badge: "Most flexible",
    highlighted: false,
  },
  {
    id: "6month",
    label: "6 Months",
    pricePerMonth: "$9.99",
    totalPrice: "$59.94 billed",
    badge: "Most popular",
    highlighted: true,
  },
  {
    id: "annual",
    label: "Annual",
    pricePerMonth: "$6.99",
    totalPrice: "$83.88 billed",
    badge: "Best value",
    highlighted: false,
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GoldSubscriptionPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoldSubscriptionPage({ onClose }: GoldSubscriptionPageProps) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState("6month");

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
            <View style={s.headerTitleRow}>
              <Crown size={18} color={COLORS.goldBadge} />
              <Text style={s.headerTitle}>Vita Gold</Text>
            </View>
            <View style={s.headerSpacer} />
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 80 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <View style={s.heroWrapper}>
              <LinearGradient
                colors={["#D4AF37", "#B8960C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.heroGradient}
              >
                <View style={s.heroIconCircle}>
                  <Crown size={48} color="#FFFFFF" />
                </View>
                <Text style={s.heroHeading}>Unlock the full experience</Text>
                <Text style={s.heroSubtext}>
                  Get more out of Vita with premium features designed to help
                  you make meaningful connections.
                </Text>
              </LinearGradient>
            </View>

            {/* Features List */}
            <View style={s.featuresSection}>
              <Text style={s.featuresTitle}>What you get</Text>
              <View style={s.featuresList}>
                {GOLD_FEATURES.map((feature) => (
                  <View key={feature.label} style={s.featureRow}>
                    <View style={s.featureCheckCircle}>
                      <Check size={14} color={COLORS.success} strokeWidth={3} />
                    </View>
                    <Text style={s.featureText}>{feature.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Plan Cards */}
            <Text style={s.plansTitle}>Choose your plan</Text>
            <View style={s.plansRow}>
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    style={[
                      s.planCard,
                      isSelected && s.planCardSelected,
                      plan.highlighted && !isSelected && s.planCardHighlighted,
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    {/* Badge */}
                    <View
                      style={[
                        s.planBadge,
                        {
                          backgroundColor: isSelected
                            ? COLORS.secondary
                            : plan.highlighted
                              ? "rgba(74,144,164,0.12)"
                              : "#F3F4F6",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.planBadgeText,
                          {
                            color: isSelected
                              ? "#FFFFFF"
                              : plan.highlighted
                                ? COLORS.secondary
                                : "#6B7280",
                          },
                        ]}
                      >
                        {plan.badge}
                      </Text>
                    </View>

                    {/* Label */}
                    <Text
                      style={[
                        s.planLabel,
                        isSelected && s.planLabelSelected,
                      ]}
                    >
                      {plan.label}
                    </Text>

                    {/* Price */}
                    <Text
                      style={[
                        s.planPrice,
                        isSelected && s.planPriceSelected,
                      ]}
                    >
                      {plan.pricePerMonth}
                    </Text>
                    <Text style={s.planPriceUnit}>/mo</Text>

                    {/* Total */}
                    {plan.totalPrice && (
                      <Text style={s.planTotal}>{plan.totalPrice}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom CTA */}
          <View
            style={[
              s.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                s.continueBtn,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={s.continueBtnText}>Continue</Text>
            </Pressable>
            <Text style={s.legalText}>Cancel anytime. Terms apply.</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

GoldSubscriptionPage.displayName = "GoldSubscriptionPage";

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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    paddingTop: 16,
  },

  // Hero
  heroWrapper: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
  },
  heroGradient: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },

  // Features
  featuresSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  featuresList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(56,161,105,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },

  // Plans
  plansTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  plansRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: "rgba(74,144,164,0.04)",
  },
  planCardHighlighted: {
    borderColor: "rgba(74,144,164,0.3)",
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 10,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  planLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  planLabelSelected: {
    color: COLORS.primary,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A2D3D",
    fontFamily: "Inter_700Bold",
  },
  planPriceSelected: {
    color: COLORS.secondary,
  },
  planPriceUnit: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  planTotal: {
    fontSize: 11,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  legalText: {
    fontSize: 11,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 8,
  },
});
