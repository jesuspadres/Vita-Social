// ---------------------------------------------------------------------------
// Haptic Emotion Signatures — a vocabulary of distinct haptic patterns
// that communicate social information non-visually.
//
// Each function composes expo-haptics primitives with Promise-based delays
// to create unique tactile "words" for different social interactions.
// ---------------------------------------------------------------------------

import * as Haptics from "expo-haptics";

// ---------------------------------------------------------------------------
// Internal helper: pause for `ms` milliseconds
// ---------------------------------------------------------------------------

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Match Heartbeat
// Double-tap mimicking a heartbeat rhythm for mutual matches.
// Pattern: thump ... thump (two heavy impacts with a short gap)
// ---------------------------------------------------------------------------

export async function playMatchHeartbeat(): Promise<void> {
  // First beat (strong)
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await wait(120);
  // Second beat (strong, slightly softer feel from the short gap)
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await wait(400);
  // Echo beat — lighter double tap to mimic the "lub-dub" aftereffect
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await wait(120);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// ---------------------------------------------------------------------------
// Proximity Buzz
// Three quick light taps for nearby users — a gentle "someone is close" nudge.
// Pattern: tap-tap-tap in rapid succession
// ---------------------------------------------------------------------------

export async function playProximityBuzz(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await wait(80);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await wait(80);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ---------------------------------------------------------------------------
// Health Ring Pulse
// Urgency-based haptic for group health status.
//   green  → none (no haptic — everything is fine)
//   yellow → single gentle tap
//   orange → double medium tap
//   red    → triple strong tap
//   gray   → single soft notification (expired / inactive)
// ---------------------------------------------------------------------------

export async function playHealthPulse(
  severity: "green" | "yellow" | "orange" | "red" | "gray",
): Promise<void> {
  switch (severity) {
    case "green":
      // No haptic for healthy state
      return;

    case "yellow":
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;

    case "orange":
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await wait(150);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;

    case "red":
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await wait(120);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await wait(120);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;

    case "gray":
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
  }
}

// ---------------------------------------------------------------------------
// Conversation Warmth
// Communicates the momentum / energy of a conversation through feel.
//   hot  → success notification + double medium (exciting!)
//   warm → single medium tap (positive)
//   cold → single light tap (muted)
//   dead → error notification (conversation has gone silent)
// ---------------------------------------------------------------------------

export async function playConversationWarmth(
  momentum: "hot" | "warm" | "cold" | "dead",
): Promise<void> {
  switch (momentum) {
    case "hot":
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await wait(200);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await wait(100);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;

    case "warm":
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;

    case "cold":
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;

    case "dead":
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
  }
}

// ---------------------------------------------------------------------------
// Celebration
// For check-in success and achievements.
// Pattern: success notification → ascending impact series (light → medium → heavy)
// ---------------------------------------------------------------------------

export async function playCelebration(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await wait(250);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await wait(100);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await wait(100);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

// ---------------------------------------------------------------------------
// Super Like
// Distinctive pattern for super-like action.
// Pattern: heavy impact → brief pause → rapid light triple-tap → heavy impact
// ---------------------------------------------------------------------------

export async function playSuperLike(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await wait(200);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await wait(60);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await wait(60);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await wait(200);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}
