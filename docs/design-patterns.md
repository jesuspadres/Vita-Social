# Vita Design Patterns Reference

> Canonical design language for all screens and components. Every new page MUST follow these patterns for consistency.

## Navigation Patterns

### Slide-In Full-Screen Overlay
Used for all sub-pages (Settings, ChatThread, GroupDetail, etc.)

```tsx
// Container
overlay: { ...StyleSheet.absoluteFillObject, zIndex: 50 }

// Slide-in on mount
const translateX = useSharedValue(SCREEN_WIDTH);
useEffect(() => {
  translateX.value = withTiming(0, {
    duration: 300,
    easing: Easing.bezierFn(0.22, 1, 0.36, 1),
  });
}, []);

// Swipe-right-to-go-back
Gesture.Pan()
  .activeOffsetX(20)
  .failOffsetY([-20, 20])
  // Dismiss when translationX > 30% screen width OR velocityX > 500
  // Rubber-band back with withSpring(0, { damping: 20, stiffness: 300 })

// Close with animation
const handleClose = () => {
  translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
  setTimeout(onClose, 260);
};
```

### Bottom Sheet
Used for forms, confirmations, and detail views.

```tsx
// Panel
panel: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" }

// Drag handle
dragHandle: { alignItems: "center", paddingTop: 12, paddingBottom: 4 }
dragBar: { width: 32, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB" }

// Entry/exit
entering={SlideInDown.duration(400).springify().damping(18)}
exiting={SlideOutDown.duration(300)}

// Backdrop
backdrop: rgba(0,0,0,0.5) with Pressable to dismiss
```

### Modal Dialog
Used for confirmations (delete account, block, unmatch).
- Uses `<Modal>` component from `@/components/ui/modal`
- Slide-up animation, backdrop dismiss, drag handle

---

## Layout Patterns

### Header Bar
```tsx
header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: "#FFFFFF",
  borderBottomWidth: 1,
  borderBottomColor: "#E2E8F0",
}
// Back button: ArrowLeft (22px, #111827), 44x44 container, borderRadius 22
// Title: fontSize 18, fontWeight "600", color "#111827", Inter_600SemiBold
// Right spacer: { width: 44 } to balance back button
```

### Settings-Style Page
```tsx
root: { flex: 1, backgroundColor: "#F7FAFC" }
scrollContent: { paddingHorizontal: 16, paddingTop: 8 }
```

### Section Header (Uppercase)
```tsx
sectionHeader: {
  fontSize: 11, fontWeight: "700", color: "#A0AEC0",
  letterSpacing: 1.2, marginTop: 24, marginBottom: 8,
  paddingLeft: 4, fontFamily: "Inter_700Bold",
}
```

### Section Group (Card Container)
```tsx
sectionGroup: {
  backgroundColor: "#FFFFFF", borderRadius: 16,
  paddingHorizontal: 14, overflow: "hidden",
  shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
}
```

### Item Divider
```tsx
itemDivider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 30 }
```

### Menu Item
```tsx
menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }
// Icon: 18px, color "#718096", strokeWidth 1.75
// Label: flex 1, fontSize 14, fontWeight "500", color "#111827", Inter_500Medium
// Value: fontSize 13, color "#A0AEC0", Inter_400Regular
// Chevron: ChevronRight 16px, color "#CBD5E0"
// Press: backgroundColor "#F7FAFC"
// Danger variant: icon + label color COLORS.danger, no chevron
```

### Toggle Item
```tsx
toggleItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, minHeight: 48 }
// Switch: trackColor={{ false: "#E2E8F0", true: COLORS.secondary }}, thumbColor="#FFFFFF"
```

### Empty State
```tsx
emptyContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 60 }
emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(74,144,164,0.1)" }
emptyTitle: { fontSize: 17, fontWeight: "600", color: COLORS.primary, Inter_600SemiBold }
emptyDesc: { fontSize: 14, color: "#9CA3AF", Inter_400Regular, textAlign: "center", lineHeight: 20 }
```

---

## Typography Scale

| Role                    | Size | Weight | Color   | Font Family        |
|-------------------------|------|--------|---------|--------------------|
| Page title              | 18   | 600    | #111827 | Inter_600SemiBold  |
| Section heading         | 16   | 600    | #1A2D3D | Inter_600SemiBold  |
| Section header (caps)   | 11   | 700    | #A0AEC0 | Inter_700Bold      |
| Body text               | 14   | 400    | #4A5568 | Inter_400Regular   |
| Menu label              | 14   | 500    | #111827 | Inter_500Medium    |
| Meta/secondary          | 12-13| 400    | #A0AEC0 | Inter_400Regular   |
| Danger text             | 14   | 600    | #E53E3E | Inter_600SemiBold  |
| Badge/chip text         | 11-13| 600    | varies  | Inter_600SemiBold  |

---

## Color Tokens

| Token             | Hex       | Usage                               |
|-------------------|-----------|-------------------------------------|
| Primary           | #1A365D   | Headers, CTAs, nav, selected states |
| Secondary         | #4A90A4   | Accents, links, switch tracks       |
| Success           | #38A169   | Positive actions, check-ins, online |
| Warning           | #D69E2E   | Alerts, health ring yellow          |
| Danger            | #E53E3E   | Errors, destructive actions         |
| Blue Badge        | #3182CE   | Verification badge                  |
| Gold Badge        | #D4AF37   | Premium badge                       |
| Text Primary      | #111827   | Headers, labels                     |
| Text Body         | #4A5568   | Body copy                           |
| Text Muted        | #718096   | Icons, secondary text               |
| Text Faint        | #A0AEC0   | Placeholders, meta, values          |
| Border            | #E2E8F0   | Card borders, dividers, inputs      |
| Divider           | #F1F5F9   | In-card dividers                    |
| Background Page   | #F7FAFC   | Settings-style scrollable pages     |
| Background Card   | #FFFFFF   | Cards, sheets, modals               |
| Press State       | #F7FAFC   | Menu item press feedback            |

---

## Component Tokens

| Token                  | Value                                          |
|------------------------|------------------------------------------------|
| Card border radius     | 16                                             |
| Button border radius   | 12 (rounded-xl) or 999 (pill)                  |
| Chip border radius     | 999                                            |
| Input border radius    | 12                                             |
| Sheet top radius       | 24                                             |
| Touch target min       | 44x44                                          |
| Standard shadow        | `{ shadowColor: "#000", offset: {0,2}, opacity: 0.08, radius: 8, elevation: 4 }` |
| Light shadow           | `{ shadowColor: "#000", offset: {0,1}, opacity: 0.04, radius: 4, elevation: 1 }` |
| Selected (primary)     | bg #1A365D, text white                         |
| Selected (secondary)   | bg #4A90A4, text white                         |
| Unselected             | bg #FFFFFF or #F9FAFB, border #E2E8F0, text #374151 |

---

## Animation Constants

```tsx
// Slide-in timing
SLIDE_DURATION = 300
SLIDE_EASING = Easing.bezierFn(0.22, 1, 0.36, 1)
SLIDE_OUT_DURATION = 250

// Swipe-to-go-back
SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3
VELOCITY_THRESHOLD = 500
RUBBER_BAND = withSpring(0, { damping: 20, stiffness: 300 })

// Press feedback
PRESS_SPRING = { damping: 15, stiffness: 300, mass: 0.6 }
PRESS_SCALE = 0.97

// Tab pager
TAB_SPRING = { damping: 20, stiffness: 200, overshootClamping: true }
```

---

## File Structure Convention

```tsx
// 1. Imports
import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ... } from "react-native";
// ... other imports

// 2. Constants & Types
const SCREEN_WIDTH = Dimensions.get("window").width;
export interface ComponentProps { ... }

// 3. Sub-components
function SectionHeader({ title }: { title: string }) { ... }
function MenuItem({ ... }: { ... }) { ... }

// 4. Main component (named export)
export function ComponentName({ ... }: ComponentProps) { ... }
ComponentName.displayName = "ComponentName";

// 5. Styles at bottom
const s = StyleSheet.create({ ... });
```

---

## Common Imports

```tsx
// Layout & animation
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, Easing, runOnJS,
} from "react-native-reanimated";

// Icons (lucide-react-native)
import { ArrowLeft, ChevronRight, X, ... } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

// Vita components
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { COLORS } from "@/lib/constants";
```
