import React from "react";
import { View, StyleSheet } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrustThermometerLevels {
  /** Phone number verified */
  phone: boolean;
  /** Photo verified */
  photo: boolean;
  /** Government ID verified */
  id: boolean;
  /** Number of events attended */
  eventsAttended: number;
}

interface TrustThermometerProps {
  levels: TrustThermometerLevels;
}

// ---------------------------------------------------------------------------
// Segment colors
// ---------------------------------------------------------------------------

const SEGMENT_COLORS = {
  phone: "#4A90A4",
  photo: "#3182CE",
  id: "#D4AF37",
  events: "#38A169",
} as const;

const SEGMENT_EMPTY = "#E2E8F0";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrustThermometer({ levels }: TrustThermometerProps) {
  const phoneVerified = levels.phone;
  const photoVerified = levels.photo;
  const idVerified = levels.id;
  const hasEvents = levels.eventsAttended > 0;

  // Build the accessibility label
  const parts: string[] = [];
  parts.push(phoneVerified ? "Phone verified" : "Phone not verified");
  parts.push(photoVerified ? "Photo verified" : "Photo not verified");
  parts.push(idVerified ? "ID verified" : "ID not verified");
  parts.push(
    hasEvents
      ? `${levels.eventsAttended} events attended`
      : "No events attended",
  );

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Trust level: ${parts.join(", ")}`}
      accessibilityRole="none"
    >
      {/* Phone segment */}
      <View
        style={[
          styles.segment,
          {
            backgroundColor: phoneVerified
              ? SEGMENT_COLORS.phone
              : SEGMENT_EMPTY,
          },
        ]}
      />

      {/* Photo segment */}
      <View
        style={[
          styles.segment,
          {
            backgroundColor: photoVerified
              ? SEGMENT_COLORS.photo
              : SEGMENT_EMPTY,
          },
        ]}
      />

      {/* ID segment */}
      <View
        style={[
          styles.segment,
          {
            backgroundColor: idVerified ? SEGMENT_COLORS.id : SEGMENT_EMPTY,
          },
        ]}
      />

      {/* Events segment */}
      <View
        style={[
          styles.segment,
          {
            backgroundColor: hasEvents
              ? SEGMENT_COLORS.events
              : SEGMENT_EMPTY,
          },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});

TrustThermometer.displayName = "TrustThermometer";
