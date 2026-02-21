// ---------------------------------------------------------------------------
// Vita -- App Constants
// Derived from the Product Requirements Document (PRD v1)
// ---------------------------------------------------------------------------

/** Application identity */
export const APP_NAME = "Vita" as const;
export const APP_TAGLINE = "The bridge from the screen to the scene." as const;

// ---------------------------------------------------------------------------
// Color Palette (Swiss-inspired design system)
// ---------------------------------------------------------------------------
export const COLORS = {
  primary: "#1A365D",
  secondary: "#4A90A4",
  success: "#38A169",
  warning: "#D69E2E",
  danger: "#E53E3E",
  blueBadge: "#3182CE",
  goldBadge: "#D4AF37",
} as const;

// ---------------------------------------------------------------------------
// Health Ring -- Thresholds
// The health ring reflects how recently a member attended a group event.
// It is driven by the 45-day health period.
// ---------------------------------------------------------------------------
export const HEALTH_PERIOD_DAYS = 45 as const;

export const HEALTH_RING_THRESHOLDS = [
  { color: "green", label: "Active", minDay: 1, maxDay: 30 },
  { color: "yellow", label: "Cooling", minDay: 31, maxDay: 37 },
  { color: "orange", label: "At Risk", minDay: 38, maxDay: 42 },
  { color: "red", label: "Critical", minDay: 43, maxDay: 45 },
  { color: "gray", label: "Inactive", minDay: 46, maxDay: Infinity },
] as const;

/**
 * Returns the health ring color for a given number of days since last check-in.
 */
export function getHealthRingColor(daysSinceCheckIn: number) {
  const threshold = HEALTH_RING_THRESHOLDS.find(
    (t) => daysSinceCheckIn >= t.minDay && daysSinceCheckIn <= t.maxDay
  );
  return threshold ?? HEALTH_RING_THRESHOLDS[HEALTH_RING_THRESHOLDS.length - 1];
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------
export const MAX_PHOTOS = 6 as const;
export const MIN_PHOTOS = 1 as const;

// ---------------------------------------------------------------------------
// Swipe / Discovery
// ---------------------------------------------------------------------------
export const SWIPE_ACTIONS = ["like", "pass", "super-like"] as const;
export type SwipeAction = (typeof SWIPE_ACTIONS)[number];

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
/** Event duration range in hours */
export const EVENT_DURATION_MIN_HOURS = 1 as const;
export const EVENT_DURATION_MAX_HOURS = 4 as const;

/** Default check-in radius in miles */
export const CHECK_IN_RADIUS_DEFAULT_MILES = 1 as const;

// ---------------------------------------------------------------------------
// Navigation Tabs
// ---------------------------------------------------------------------------
export const TABS = [
  "feed",
  "discover",
  "map",
  "messages",
  "profile",
] as const;
export type Tab = (typeof TABS)[number];
