import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Mail } from "lucide-react-native";
import { SwipeDeck } from "@/components/discover/SwipeDeck";
import { DiscoverGroups } from "@/components/discover/DiscoverGroups";
import { ThoughtfulPicks } from "@/components/discover/ThoughtfulPicks";
import { InvitesModal } from "@/components/discover/InvitesModal";
import { GroupDetail } from "@/components/groups/GroupDetail";
import { getUnreadInviteCount, type MockGroup } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = "people" | "groups" | "picks";

const TAB_LABELS: Record<Tab, string> = {
  people: "People",
  groups: "Groups",
  picks: "Picks",
};

const TAB_ORDER: Tab[] = ["people", "groups", "picks"];

// ---------------------------------------------------------------------------
// Discover Screen
// ---------------------------------------------------------------------------

export default function DiscoverScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("people");
  const [showInvites, setShowInvites] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<MockGroup | null>(null);

  const inviteCount = getUnreadInviteCount();

  // Animated pill position: 0 = People, 1 = Groups, 2 = Picks
  const pillTranslateX = useSharedValue(0);
  const [pillContainerWidth, setPillContainerWidth] = useState(0);

  const tabCount = TAB_ORDER.length;
  const tabWidth = pillContainerWidth / tabCount;

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillTranslateX.value }],
    width: tabWidth,
  }));

  const handleTabChange = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      const tabIndex = TAB_ORDER.indexOf(tab);
      pillTranslateX.value = withTiming(tabIndex * tabWidth, {
        duration: 250,
      });
    },
    [tabWidth, pillTranslateX],
  );

  const handleGroupPress = useCallback((group: MockGroup) => {
    setSelectedGroup(group);
  }, []);

  const handleJoinGroup = useCallback((_group: MockGroup) => {
    // Mock join action
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vita</Text>

        {/* Invites Button */}
        <Pressable
          onPress={() => setShowInvites(true)}
          style={styles.invitesButton}
        >
          <Mail size={22} color="#1A365D" />
          {inviteCount > 0 && (
            <View style={styles.invitesBadge}>
              <Text style={styles.invitesBadgeText}>
                {inviteCount > 9 ? "9+" : inviteCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <View
          style={styles.tabContainer}
          onLayout={(e) => setPillContainerWidth(e.nativeEvent.layout.width)}
        >
          {/* Animated pill background */}
          <Animated.View style={[styles.pill, pillStyle]} />

          {/* Tab Buttons */}
          {TAB_ORDER.map((tab) => (
            <Pressable
              key={tab}
              style={styles.tabButton}
              onPress={() => handleTabChange(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                ]}
              >
                {TAB_LABELS[tab]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "people" && <SwipeDeck />}
        {activeTab === "groups" && (
          <DiscoverGroups
            onGroupPress={handleGroupPress}
            onJoinGroup={handleJoinGroup}
          />
        )}
        {activeTab === "picks" && <ThoughtfulPicks />}
      </View>

      {/* Group Detail Overlay */}
      {selectedGroup && (
        <GroupDetail
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
        />
      )}

      {/* Invites Modal */}
      <InvitesModal
        visible={showInvites}
        onClose={() => setShowInvites(false)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  invitesButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  invitesBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  invitesBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  tabRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabContainer: {
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
    paddingVertical: 12,
    minHeight: 44,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabTextInactive: {
    color: "#718096",
  },
  content: {
    flex: 1,
  },
});
