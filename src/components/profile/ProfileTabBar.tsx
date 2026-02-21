import React, { useState, useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProfileTab = "posts" | "checkins" | "about";

const TAB_LABELS: { key: ProfileTab; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "checkins", label: "Check-ins" },
  { key: "about", label: "About" },
];

const TAB_COUNT = TAB_LABELS.length;

export interface ProfileTabBarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  pagerTranslateX: SharedValue<number>;
  screenWidth: number;
}

// ---------------------------------------------------------------------------
// Animated Tab Label — color follows swipe progress
// ---------------------------------------------------------------------------

function AnimatedTabLabel({
  label,
  index,
  translateX,
  screenWidth,
  onPress,
}: {
  label: string;
  index: number;
  translateX: SharedValue<number>;
  screenWidth: number;
  onPress: () => void;
}) {
  const textStyle = useAnimatedStyle(() => {
    const progress = screenWidth > 0 ? -translateX.value / screenWidth : 0;
    const color = interpolateColor(
      progress,
      [index - 1, index, index + 1],
      ["#A0AEC0", "#FFFFFF", "#A0AEC0"],
    );
    return { color };
  });

  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Animated.Text style={[styles.tabText, textStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileTabBar({
  activeTab,
  onTabChange,
  pagerTranslateX,
  screenWidth,
}: ProfileTabBarProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const pillStyle = useAnimatedStyle(() => {
    if (containerWidth === 0 || screenWidth === 0) {
      return { width: 0, transform: [{ translateX: 0 }] };
    }
    const tw = containerWidth / TAB_COUNT;
    const progress = -pagerTranslateX.value / screenWidth;
    return {
      transform: [{ translateX: progress * tw }],
      width: tw,
    };
  });

  const handleTabPress = useCallback(
    (tab: ProfileTab) => {
      const index = TAB_LABELS.findIndex((t) => t.key === tab);
      pagerTranslateX.value = withTiming(-index * screenWidth, {
        duration: 300,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onTabChange(tab);
    },
    [screenWidth, pagerTranslateX, onTabChange],
  );

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.container}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.pill, pillStyle]} />

        {TAB_LABELS.map((tab, index) => (
          <AnimatedTabLabel
            key={tab.key}
            label={tab.label}
            index={index}
            translateX={pagerTranslateX}
            screenWidth={screenWidth}
            onPress={() => handleTabPress(tab.key)}
          />
        ))}
      </View>
    </View>
  );
}

ProfileTabBar.displayName = "ProfileTabBar";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#F7FAFC",
    borderRadius: 999,
    padding: 4,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: "#1A365D",
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
