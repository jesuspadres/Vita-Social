import React, { useEffect } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { MockEvent, EventVisibility } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISIBILITY_COLORS: Record<EventVisibility, string> = {
  public: "#4A90A4",
  group: "#1A365D",
  friends: "#38A169",
};

const MIN_SIZE = 14;
const MAX_SIZE = 22;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLive(event: MockEvent): boolean {
  const now = Date.now();
  return (
    new Date(event.starts_at).getTime() <= now &&
    new Date(event.ends_at).getTime() > now
  );
}

function getPinSize(attendeeCount: number): number {
  // Clamp between MIN_SIZE and MAX_SIZE based on attendee count
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, MIN_SIZE + attendeeCount * 0.5));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EventPinProps {
  event: MockEvent;
  isActive: boolean;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventPin({ event, isActive, onPress }: EventPinProps) {
  const color = VISIBILITY_COLORS[event.visibility];
  const live = isLive(event);
  const pinSize = getPinSize(event.attendee_count);
  const activeSize = pinSize + 4;
  const displaySize = isActive ? activeSize : pinSize;

  // Pulsing ring animation for live events
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (live) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.8, { duration: 1200, easing: Easing.out(Easing.ease) }),
        ),
        -1, // infinite
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 0 }),
          withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [live, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      accessibilityLabel={`${event.title}, ${event.attendee_count} attendees`}
      accessibilityRole="button"
      style={[styles.container, { marginLeft: -displaySize / 2, marginTop: -displaySize / 2 }]}
    >
      {/* Pulsing ring (live events only) */}
      {live && (
        <Animated.View
          style={[
            {
              position: "absolute",
              width: displaySize,
              height: displaySize,
              borderRadius: displaySize / 2,
              borderWidth: 2,
              borderColor: color,
            },
            pulseStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {/* Active state ring */}
      {isActive && (
        <View
          style={{
            position: "absolute",
            width: displaySize + 6,
            height: displaySize + 6,
            borderRadius: (displaySize + 6) / 2,
            borderWidth: 2,
            borderColor: color,
            marginLeft: -3,
            marginTop: -3,
          }}
        />
      )}

      {/* Main dot */}
      <View
        style={[
          styles.dot,
          {
            width: displaySize,
            height: displaySize,
            borderRadius: displaySize / 2,
            backgroundColor: color,
          },
        ]}
      />

      {/* Attendee count badge */}
      {event.attendee_count > 5 && (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{event.attendee_count}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -12,
    minWidth: 20,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
});

EventPin.displayName = "EventPin";
