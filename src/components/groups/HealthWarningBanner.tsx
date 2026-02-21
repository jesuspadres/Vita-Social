import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react-native";
import { HealthRing } from "@/components/ui/health-ring";
import { Button } from "@/components/ui/button";
import { HEALTH_PERIOD_DAYS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthWarningBannerProps {
  /** Number of days remaining in the health window */
  daysRemaining: number;
  /** Check-in CTA */
  onCheckIn?: () => void;
  /** Post something CTA */
  onPost?: () => void;
  /** Rejoin CTA */
  onRejoin?: () => void;
}

// ---------------------------------------------------------------------------
// Banner Tiers
// ---------------------------------------------------------------------------

interface BannerTier {
  bgColor: string;
  iconColor: string;
  headlineColor: string;
  messageColor: string;
  Icon: typeof AlertCircle;
  headline: string;
  message: string;
  buttonLabel: string;
  buttonVariant: "primary" | "secondary" | "danger" | "ghost";
  action: "checkIn" | "post" | "rejoin";
}

function getTier(daysRemaining: number): BannerTier | null {
  if (daysRemaining > 30) return null;

  if (daysRemaining >= 15) {
    return {
      bgColor: "#FEFCE8",
      iconColor: "#D69E2E",
      headlineColor: "#92400E",
      messageColor: "#78716C",
      Icon: AlertCircle,
      headline: "Stay Active!",
      message: `Your ring is cooling down. Check nearby events to stay in the green.`,
      buttonLabel: "Find an Event",
      buttonVariant: "primary",
      action: "checkIn",
    };
  }

  if (daysRemaining >= 8) {
    return {
      bgColor: "#FFF7ED",
      iconColor: "#DD6B20",
      headlineColor: "#9A3412",
      messageColor: "#78716C",
      Icon: AlertTriangle,
      headline: "Running Low",
      message: `There's still time — find an event this week to reset your ring.`,
      buttonLabel: "Find an Event",
      buttonVariant: "secondary",
      action: "checkIn",
    };
  }

  if (daysRemaining >= 1) {
    return {
      bgColor: "#FEF2F2",
      iconColor: "#E53E3E",
      headlineColor: "#991B1B",
      messageColor: "#78716C",
      Icon: AlertTriangle,
      headline: "Almost Expired!",
      message: `Your last chance this cycle. One check-in resets everything.`,
      buttonLabel: "Check In Now",
      buttonVariant: "danger",
      action: "checkIn",
    };
  }

  // daysRemaining <= 0
  return {
    bgColor: "#F3F4F6",
    iconColor: "#9CA3AF",
    headlineColor: "#374151",
    messageColor: "#6B7280",
    Icon: RefreshCw,
    headline: "Time for a fresh start",
    message:
      "Your ring reset. Rejoin and check into any event to light it back up.",
    buttonLabel: "Start Fresh",
    buttonVariant: "primary",
    action: "rejoin",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HealthWarningBanner({
  daysRemaining,
  onCheckIn,
  onPost,
  onRejoin,
}: HealthWarningBannerProps) {
  const tier = getTier(daysRemaining);
  if (!tier) return null;

  const daysElapsed = HEALTH_PERIOD_DAYS - Math.max(0, daysRemaining);

  const handleAction = () => {
    switch (tier.action) {
      case "checkIn":
        onCheckIn?.();
        break;
      case "post":
        onPost?.();
        break;
      case "rejoin":
        onRejoin?.();
        break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tier.bgColor }]}>
      <View style={styles.row}>
        {/* Health Ring */}
        <HealthRing
          daysElapsed={daysElapsed}
          size={44}
          strokeWidth={3}
        />

        {/* Icon + Text */}
        <View style={styles.textContainer}>
          <View style={styles.headlineRow}>
            <tier.Icon size={16} color={tier.iconColor} />
            <Text style={[styles.headline, { color: tier.headlineColor }]}>
              {tier.headline}
            </Text>
          </View>
          <Text style={[styles.message, { color: tier.messageColor }]}>
            {tier.message}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <Button
        variant={tier.buttonVariant}
        size="sm"
        onPress={handleAction}
        fullWidth
      >
        {tier.buttonLabel}
      </Button>
    </View>
  );
}

HealthWarningBanner.displayName = "HealthWarningBanner";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headline: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
  },
});
