import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  Check,
  Shield,
  Crown,
  ChevronRight,
  Camera,
  CreditCard,
  Star,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Tier Configuration
// ---------------------------------------------------------------------------

export type VerificationTier = "none" | "green" | "blue" | "gold";

interface TierConfig {
  key: VerificationTier;
  label: string;
  sublabel: string;
  Icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  benefits: string[];
  actionLabel: string;
  ActionIcon: LucideIcon;
}

const TIERS: TierConfig[] = [
  {
    key: "none",
    label: "Unverified",
    sublabel: "No verification",
    Icon: Shield,
    color: "#A0AEC0",
    bgColor: "#F7FAFC",
    borderColor: "#E2E8F0",
    benefits: ["Basic profile visibility"],
    actionLabel: "Start Verification",
    ActionIcon: Camera,
  },
  {
    key: "green",
    label: "Green",
    sublabel: "Photo Verified",
    Icon: Check,
    color: COLORS.success,
    bgColor: "#F0FFF4",
    borderColor: COLORS.success,
    benefits: [
      "Verified badge on profile",
      "Higher trust in matches",
      "Group join priority",
    ],
    actionLabel: "Verified",
    ActionIcon: Check,
  },
  {
    key: "blue",
    label: "Blue",
    sublabel: "ID Verified",
    Icon: Shield,
    color: "#3182CE",
    bgColor: "#EBF8FF",
    borderColor: "#3182CE",
    benefits: [
      "Blue badge on profile",
      "Access to verified-only groups",
      "Enhanced trust score",
      "Priority matching",
    ],
    actionLabel: "Upgrade to Blue",
    ActionIcon: CreditCard,
  },
  {
    key: "gold",
    label: "Gold",
    sublabel: "Premium Member",
    Icon: Crown,
    color: COLORS.goldBadge,
    bgColor: "#FFFBEB",
    borderColor: COLORS.goldBadge,
    benefits: [
      "Gold crown badge",
      "All Blue benefits",
      "Super Vouch ability",
      "Priority in all groups",
      "Unlimited Super Likes",
    ],
    actionLabel: "Go Gold",
    ActionIcon: Star,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTierIndex(tier: VerificationTier): number {
  return TIERS.findIndex((t) => t.key === tier);
}

// Progress dot colors (for the connecting dots)
const DOT_COLORS: Record<string, string> = {
  none: "#A0AEC0",
  green: COLORS.success,
  blue: "#3182CE",
  gold: COLORS.goldBadge,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerificationCardProps {
  currentTier: VerificationTier;
  onUpgrade?: (nextTier: VerificationTier) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VerificationCard({
  currentTier,
  onUpgrade,
}: VerificationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const currentIndex = getTierIndex(currentTier);
  const currentConfig = TIERS[currentIndex];
  const nextTier =
    currentIndex < TIERS.length - 1 ? TIERS[currentIndex + 1] : null;

  const handleToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <Card variant="outlined">
      {/* ── Header (tappable) ── */}
      <Pressable onPress={handleToggleExpand} style={s.header}>
        {/* Tier icon */}
        <View
          style={[
            s.tierIcon,
            {
              backgroundColor: currentConfig.bgColor,
              borderColor: currentConfig.borderColor,
            },
          ]}
        >
          <currentConfig.Icon
            size={20}
            color={currentConfig.color}
            strokeWidth={2.5}
          />
        </View>

        {/* Label */}
        <View style={s.headerText}>
          <Text style={s.tierLabel}>
            {currentConfig.label} Verified
          </Text>
          <Text style={s.tierSublabel}>{currentConfig.sublabel}</Text>
        </View>

        {/* Chevron */}
        <View
          style={[
            s.chevronWrapper,
            expanded && { transform: [{ rotate: "90deg" }] },
          ]}
        >
          <ChevronRight size={16} color="#A0AEC0" />
        </View>
      </Pressable>

      {/* ── Progress Dots ── */}
      <View style={s.progressRow}>
        {TIERS.map((tier, i) => {
          const isCompleted = i <= currentIndex;
          const dotColor = isCompleted ? DOT_COLORS[tier.key] : "#E2E8F0";
          const isLast = i === TIERS.length - 1;

          return (
            <View key={tier.key} style={s.progressItem}>
              {/* Bar segment */}
              <View
                style={[
                  s.progressBar,
                  { backgroundColor: dotColor },
                ]}
              />
              {/* Tier label */}
              <Text
                style={[
                  s.progressLabel,
                  { color: isCompleted ? "#374151" : "#A0AEC0" },
                ]}
              >
                {tier.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ── Expandable Details ── */}
      {expanded && (
        <View style={s.expandedContent}>
          <View style={s.divider} />

          {/* Current tier benefits */}
          <View style={s.benefitsSection}>
            <Text style={s.benefitsSectionTitle}>CURRENT BENEFITS</Text>
            {currentConfig.benefits.map((benefit) => (
              <View key={benefit} style={s.benefitRow}>
                <Check
                  size={14}
                  color={currentConfig.color}
                  strokeWidth={2.5}
                />
                <Text style={s.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Next tier upsell */}
          {nextTier && (
            <View
              style={[
                s.upsellBox,
                {
                  backgroundColor:
                    nextTier.key === "gold"
                      ? "rgba(212,175,55,0.1)"
                      : nextTier.bgColor,
                  borderColor:
                    nextTier.key === "gold"
                      ? "rgba(212,175,55,0.25)"
                      : "transparent",
                },
              ]}
            >
              <View style={s.upsellHeader}>
                <nextTier.Icon
                  size={16}
                  color={nextTier.color}
                  strokeWidth={2.5}
                />
                <Text style={s.upsellTitle}>
                  Upgrade to {nextTier.label}
                </Text>
              </View>

              {nextTier.benefits.map((benefit) => (
                <View key={benefit} style={s.upsellBenefitRow}>
                  <Check
                    size={12}
                    color={nextTier.color}
                    strokeWidth={2.5}
                  />
                  <Text style={s.upsellBenefitText}>{benefit}</Text>
                </View>
              ))}

              <View style={s.upsellBtnWrapper}>
                <Button
                  size="sm"
                  variant={nextTier.key === "gold" ? "primary" : "secondary"}
                  fullWidth
                  onPress={() => onUpgrade?.(nextTier.key)}
                  iconLeft={
                    <nextTier.ActionIcon
                      size={14}
                      color="#FFFFFF"
                      strokeWidth={2}
                    />
                  }
                >
                  {nextTier.actionLabel}
                </Button>
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

VerificationCard.displayName = "VerificationCard";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  tierIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  tierSublabel: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  chevronWrapper: {
    padding: 12,
    marginRight: -8,
  },

  // Progress
  progressRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 6,
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  progressBar: {
    height: 5,
    width: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },

  // Expanded
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 14,
  },

  // Benefits
  benefitsSection: {
    marginBottom: 16,
  },
  benefitsSectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A0AEC0",
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 13,
    color: "#374151",
    fontFamily: "Inter_400Regular",
  },

  // Upsell
  upsellBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  upsellHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  upsellTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  upsellBenefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  upsellBenefitText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  upsellBtnWrapper: {
    marginTop: 12,
  },
});
