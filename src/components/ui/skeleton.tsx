import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";

/* ─── Pulse Hook ─── */

function usePulseAnimation() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/* ─── Skeleton ─── */

export interface SkeletonProps {
  /** Width of the skeleton (number or percentage like "100%") */
  width?: number | `${number}%`;
  /** Height of the skeleton */
  height?: number | `${number}%`;
  /** Border radius */
  borderRadius?: number;
  /** Additional className */
  className?: string;
}

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  className,
}: SkeletonProps) {
  const pulseStyle = usePulseAnimation();

  return (
    <Animated.View
      className={cn("bg-gray-200", className)}
      style={[
        {
          width: width,
          height: height,
          borderRadius,
        },
        pulseStyle,
      ]}
    />
  );
}

Skeleton.displayName = "Skeleton";

/* ─── SkeletonCircle ─── */

export interface SkeletonCircleProps {
  /** Diameter of the circle */
  size?: number;
  /** Additional className */
  className?: string;
}

export function SkeletonCircle({ size = 48, className }: SkeletonCircleProps) {
  const pulseStyle = usePulseAnimation();

  return (
    <Animated.View
      className={cn("bg-gray-200", className)}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        pulseStyle,
      ]}
    />
  );
}

SkeletonCircle.displayName = "SkeletonCircle";

/* ─── SkeletonText ─── */

export interface SkeletonTextProps {
  /** Number of lines to render */
  numLines?: number;
  /** Line height */
  lineHeight?: number;
  /** Additional className */
  className?: string;
}

/** Predefined width percentages that cycle for a natural look */
const lineWidths: `${number}%`[] = ["100%", "83%", "67%", "75%", "60%"];

export function SkeletonText({
  numLines = 3,
  lineHeight = 12,
  className,
}: SkeletonTextProps) {
  const pulseStyle = usePulseAnimation();

  return (
    <View className={cn("gap-2", className)}>
      {Array.from({ length: numLines }).map((_, i) => (
        <Animated.View
          key={i}
          className="bg-gray-200"
          style={[
            {
              width: lineWidths[i % lineWidths.length],
              height: lineHeight,
              borderRadius: 4,
            },
            pulseStyle,
          ]}
        />
      ))}
    </View>
  );
}

SkeletonText.displayName = "SkeletonText";
