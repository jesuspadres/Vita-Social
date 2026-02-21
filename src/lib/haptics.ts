import * as Haptics from "expo-haptics";

/**
 * Haptic feedback utility wrapping expo-haptics.
 *
 * Provides semantic haptic feedback methods for common interactions.
 * Each method maps to the appropriate iOS/Android haptic engine style.
 */
export const haptics = {
  /** Subtle tap -- e.g. pass / dismiss */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Medium tap -- e.g. like / confirm */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Strong tap -- e.g. super-like / important action */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Success notification feedback */
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Error notification feedback */
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Warning notification feedback */
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
