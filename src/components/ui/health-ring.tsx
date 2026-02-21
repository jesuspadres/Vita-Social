import React, { useEffect, useMemo } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ─── Animated Circle ─── */

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ─── Color thresholds ─── */

function getRingColor(days: number): string {
  if (days <= 30) return "#38A169"; // green
  if (days <= 37) return "#D69E2E"; // yellow
  if (days <= 42) return "#DD6B20"; // orange
  if (days <= 45) return "#E53E3E"; // red
  return "#A0AEC0"; // gray
}

/* ─── Types ─── */

export interface HealthRingProps {
  /** Number of days elapsed since last connection (1-46+) */
  daysElapsed: number;
  /** Total window in days (default 45) */
  totalDays?: number;
  /** Diameter of the ring in pixels */
  size?: number;
  /** Stroke width of the ring in pixels */
  strokeWidth?: number;
}

/* ─── Component ─── */

export function HealthRing({
  daysElapsed,
  totalDays = 45,
  size = 48,
  strokeWidth = 3,
}: HealthRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const { progress, daysRemaining, isExpired } = useMemo(() => {
    const clamped = Math.max(0, daysElapsed);
    const remaining = Math.max(0, totalDays - clamped);
    const pct = Math.min(clamped / totalDays, 1);
    return {
      progress: pct,
      daysRemaining: remaining,
      isExpired: clamped > totalDays,
    };
  }, [daysElapsed, totalDays]);

  const ringColor = getRingColor(daysElapsed);
  const reduceMotion = useReducedMotion();

  // Animated stroke dash offset
  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    const targetOffset = circumference * (1 - progress);
    if (reduceMotion) {
      // Skip animation -- jump to final value instantly
      animatedOffset.value = targetOffset;
    } else {
      animatedOffset.value = withTiming(targetOffset, {
        duration: 1000,
        easing: Easing.bezierFn(0.22, 1, 0.36, 1),
      });
    }
  }, [progress, circumference, animatedOffset, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  // Font size for center text
  const fontSize = size >= 80 ? 18 : size >= 48 ? 14 : 10;
  const labelSize = size >= 80 ? 9 : 7;

  return (
    <View
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      accessibilityRole="none"
      accessibilityLabel={
        isExpired
          ? "Connection expired"
          : `${daysRemaining} days remaining`
      }
    >
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Animated progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>

      {/* Center text */}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text
          style={{
            fontSize,
            fontWeight: "700",
            color: ringColor,
            lineHeight: fontSize * 1.1,
          }}
        >
          {isExpired ? "0" : daysRemaining}
        </Text>
        <Text
          style={{
            fontSize: labelSize,
            fontWeight: "500",
            color: "#A0AEC0",
            marginTop: 1,
          }}
        >
          {isExpired ? "expired" : "days"}
        </Text>
      </View>
    </View>
  );
}

HealthRing.displayName = "HealthRing";
