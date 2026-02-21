import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { ArrowLeft } from "lucide-react-native";
import { Fab } from "@/components/ui/fab";
import { GroupCard } from "@/components/groups/GroupCard";
import { GroupDetail } from "@/components/groups/GroupDetail";
import { CreateGroupSheet } from "@/components/groups/CreateGroupSheet";
import { mockGroups, type MockGroup } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export interface MyGroupsPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MyGroupsPage({ onClose }: MyGroupsPageProps) {
  const insets = useSafeAreaInsets();
  const [selectedGroup, setSelectedGroup] = useState<MockGroup | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const myGroups = mockGroups.filter((g) => g.is_member);

  // Slide-in animation
  const translateX = useSharedValue(SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezierFn(0.22, 1, 0.36, 1),
    });
  }, [translateX]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleClose = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
    setTimeout(onClose, 260);
  }, [translateX, onClose]);

  // Swipe-right-to-go-back gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (
        event.translationX > SWIPE_THRESHOLD ||
        event.velocityX > VELOCITY_THRESHOLD
      ) {
        translateX.value = withTiming(
          SCREEN_WIDTH,
          { duration: 250 },
          (finished) => {
            if (finished) runOnJS(onClose)();
          },
        );
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const handleGroupPress = useCallback((group: MockGroup) => {
    setSelectedGroup(group);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MockGroup }) => (
      <GroupCard group={item} variant="list" onPress={handleGroupPress} />
    ),
    [handleGroupPress],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.overlay, slideStyle]}>
        <View style={[styles.root, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={handleClose}
              style={styles.backBtn}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <Text style={styles.headerTitle}>My Groups</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Subtitle */}
          <View style={styles.subtitle}>
            <Text style={styles.subtitleText}>
              {myGroups.length} group{myGroups.length !== 1 ? "s" : ""} joined
            </Text>
          </View>

          {/* List */}
          <FlatList
            data={myGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />

          {/* FAB */}
          <Fab onPress={() => setShowCreateGroup(true)} accessibilityLabel="Create new group" />
        </View>

        {/* Group Detail overlay */}
        {selectedGroup && (
          <GroupDetail
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        )}

        {/* Create Group Sheet */}
        <CreateGroupSheet
          visible={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
        />
      </Animated.View>
    </GestureDetector>
  );
}

MyGroupsPage.displayName = "MyGroupsPage";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },

  // Subtitle
  subtitle: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  subtitleText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },

  // List
  listContent: {
    paddingTop: 4,
    paddingBottom: 40,
  },

});
