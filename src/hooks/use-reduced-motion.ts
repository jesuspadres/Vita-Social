import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Listens to the system "Reduce Motion" accessibility setting.
 *
 * Returns `true` when the user has enabled reduced motion in their
 * device settings. Components should skip or shorten animations
 * accordingly to improve comfort and usability.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}
