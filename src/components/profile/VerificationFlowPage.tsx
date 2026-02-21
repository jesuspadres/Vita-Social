import React, { useCallback, useEffect } from "react";
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
  Shield,
  CheckCircle,
  Circle,
  Star,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
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

export type VerificationFlowTier = "blue" | "green" | "gold";

export interface VerificationFlowPageProps {
  onClose: () => void;
  tier: VerificationFlowTier;
}

// ---------------------------------------------------------------------------
// Tier Data
// ---------------------------------------------------------------------------

interface RequirementItem {
  label: string;
  met: boolean;
}

interface BenefitItem {
  label: string;
}

interface TierData {
  name: string;
  subtitle: string;
  color: string;
  requirements: RequirementItem[];
  benefits: BenefitItem[];
  ctaLabel: string;
}

const TIER_DATA: Record<VerificationFlowTier, TierData> = {
  blue: {
    name: "Blue Verified",
    subtitle:
      "Verify your identity with a government-issued ID for a trusted blue badge on your profile.",
    color: "#3182CE",
    requirements: [
      { label: "Upload government-issued ID", met: false },
      { label: "Take a live selfie", met: false },
      { label: "Match verification (AI check)", met: false },
    ],
    benefits: [
      { label: "Blue badge displayed on your profile" },
      { label: "Access to verified-only groups and events" },
      { label: "Enhanced trust score in matching" },
      { label: "Priority placement in discovery" },
    ],
    ctaLabel: "Start Verification",
  },
  green: {
    name: "Green Verified",
    subtitle:
      "Earn your green badge by being an active and trusted community member through real-world participation.",
    color: COLORS.success,
    requirements: [
      { label: "Attend 5+ events with GPS check-in", met: true },
      { label: "Active group member for 30+ days", met: true },
      { label: "No community violations", met: false },
    ],
    benefits: [
      { label: "Green verified badge on your profile" },
      { label: "Higher trust in matches and groups" },
      { label: "Group join priority" },
      { label: "Recognized as an active community member" },
    ],
    ctaLabel: "View Progress",
  },
  gold: {
    name: "Gold Verified",
    subtitle:
      "Unlock the ultimate Vita experience with Gold. Premium features, priority access, and exclusive benefits.",
    color: "#D4AF37",
    requirements: [
      { label: "Active Vita Gold subscription", met: false },
      { label: "All Blue verification steps", met: false },
      { label: "Priority support access", met: false },
    ],
    benefits: [
      { label: "Gold crown badge on your profile" },
      { label: "Unlimited Super Likes and Super Vouches" },
      { label: "Priority in all groups and events" },
      { label: "Dedicated priority support" },
    ],
    ctaLabel: "Subscribe to Gold",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RequirementRow({
  index,
  label,
  met,
  tierColor,
}: {
  index: number;
  label: string;
  met: boolean;
  tierColor: string;
}) {
  return (
    <View style={s.requirementRow}>
      {/* Numbered circle */}
      <View
        style={[
          s.numberCircle,
          met
            ? { backgroundColor: tierColor }
            : { backgroundColor: "#F3F4F6" },
        ]}
      >
        <Text
          style={[
            s.numberText,
            met ? { color: "#FFFFFF" } : { color: "#9CA3AF" },
          ]}
        >
          {index + 1}
        </Text>
      </View>

      {/* Label */}
      <Text style={[s.requirementLabel, met && { color: "#374151" }]}>
        {label}
      </Text>

      {/* Status icon */}
      {met ? (
        <CheckCircle size={18} color={COLORS.success} strokeWidth={2} />
      ) : (
        <Circle size={18} color="#D1D5DB" strokeWidth={1.5} />
      )}
    </View>
  );
}

function BenefitRow({ label }: { label: string }) {
  return (
    <View style={s.benefitRow}>
      <Star size={16} color="#D4AF37" strokeWidth={1.75} />
      <Text style={s.benefitLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function VerificationFlowPage({
  onClose,
  tier,
}: VerificationFlowPageProps) {
  const insets = useSafeAreaInsets();
  const data = TIER_DATA[tier];

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
            <Text style={s.headerTitle}>Get Verified</Text>
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
            {/* Hero section */}
            <View style={s.heroSection}>
              <View
                style={[s.heroIconCircle, { backgroundColor: data.color + "18" }]}
              >
                <Shield size={40} color={data.color} strokeWidth={1.75} />
              </View>
              <Text style={s.heroTitle}>{data.name}</Text>
              <Text style={s.heroSubtitle}>{data.subtitle}</Text>
            </View>

            {/* Requirements section */}
            <Text style={s.sectionHeader}>REQUIREMENTS</Text>
            <View style={s.sectionGroup}>
              {data.requirements.map((req, i) => (
                <View key={req.label}>
                  <RequirementRow
                    index={i}
                    label={req.label}
                    met={req.met}
                    tierColor={data.color}
                  />
                  {i < data.requirements.length - 1 && (
                    <View style={s.itemDivider} />
                  )}
                </View>
              ))}
            </View>

            {/* Benefits section */}
            <Text style={s.sectionHeader}>BENEFITS</Text>
            <View style={s.sectionGroup}>
              {data.benefits.map((benefit, i) => (
                <View key={benefit.label}>
                  <BenefitRow label={benefit.label} />
                  {i < data.benefits.length - 1 && (
                    <View style={s.itemDivider} />
                  )}
                </View>
              ))}
            </View>

            {/* CTA button */}
            <View style={s.ctaWrapper}>
              <Button
                variant={tier === "gold" ? "primary" : "secondary"}
                size="md"
                fullWidth
                iconLeft={<Shield size={16} color="#FFFFFF" />}
              >
                {data.ctaLabel}
              </Button>
            </View>

            {/* Muted text */}
            <Text style={s.mutedText}>
              Verification typically takes 24-48 hours
            </Text>
          </ScrollView>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

VerificationFlowPage.displayName = "VerificationFlowPage";

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
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  // Hero
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  heroIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#718096",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 8,
  },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A0AEC0",
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: "Inter_700Bold",
  },

  // Section group (card)
  sectionGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 42,
  },

  // Requirement row
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  requirementLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#718096",
    fontFamily: "Inter_500Medium",
  },

  // Benefit row
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  benefitLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter_500Medium",
  },

  // CTA
  ctaWrapper: {
    marginTop: 32,
  },

  // Muted text
  mutedText: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 14,
  },
});
