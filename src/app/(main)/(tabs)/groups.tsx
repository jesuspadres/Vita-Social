import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Search, Plus } from "lucide-react-native";
import { Fab } from "@/components/ui/fab";
import { GroupCard } from "@/components/groups/GroupCard";
import { GroupDetail } from "@/components/groups/GroupDetail";
import { CreateGroupSheet } from "@/components/groups/CreateGroupSheet";
import {
  mockGroups,
  groupCategories,
  type MockGroup,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = "my" | "discover";

// ---------------------------------------------------------------------------
// Groups Screen
// ---------------------------------------------------------------------------

export default function GroupsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedGroup, setSelectedGroup] = useState<MockGroup | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Animated pill position: 0 = My Groups, 1 = Discover
  const pillTranslateX = useSharedValue(0);
  const [pillContainerWidth, setPillContainerWidth] = useState(0);
  const tabWidth = pillContainerWidth / 2;

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillTranslateX.value }],
    width: tabWidth,
  }));

  const handleTabChange = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      pillTranslateX.value = withTiming(tab === "my" ? 0 : tabWidth, {
        duration: 250,
      });
    },
    [tabWidth, pillTranslateX],
  );

  // ── Data filtering ──

  const myGroups = useMemo(
    () => mockGroups.filter((g) => g.is_member),
    [],
  );

  const discoverGroups = useMemo(() => {
    let groups = mockGroups.filter((g) => !g.is_member);

    // Search filter
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      groups = groups.filter((g) =>
        g.name.toLowerCase().includes(query),
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      groups = groups.filter((g) => g.category === selectedCategory);
    }

    return groups;
  }, [searchText, selectedCategory]);

  // ── Renderers ──

  const renderMyGroupItem = useCallback(
    ({ item }: { item: MockGroup }) => (
      <GroupCard
        group={item}
        variant="list"
        onPress={(g) => setSelectedGroup(g)}
      />
    ),
    [],
  );

  const renderDiscoverItem = useCallback(
    ({ item }: { item: MockGroup }) => (
      <GroupCard
        group={item}
        variant="grid"
        onPress={(g) => setSelectedGroup(g)}
        onJoin={(g) => {
          // Mock join action
        }}
      />
    ),
    [],
  );

  const allCategories = useMemo(
    () => ["All", ...groupCategories],
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <View
          style={styles.tabContainer}
          onLayout={(e) => setPillContainerWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.pill, pillStyle]} />

          <Pressable
            style={styles.tabButton}
            onPress={() => handleTabChange("my")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "my"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              My Groups
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabButton}
            onPress={() => handleTabChange("discover")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "discover"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              Discover
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "my" ? (
          /* ─── My Groups Tab ─── */
          myGroups.length > 0 ? (
            <FlatList
              data={myGroups}
              keyExtractor={(item) => item.id}
              renderItem={renderMyGroupItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.myGroupsList}
              ListHeaderComponent={
                <Pressable
                  onPress={() => setShowCreateGroup(true)}
                  style={({ pressed }) => [
                    styles.createGroupCard,
                    pressed && styles.createGroupCardPressed,
                  ]}
                >
                  <View style={styles.createGroupIcon}>
                    <Plus size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.createGroupText}>
                    <Text style={styles.createGroupTitle}>Create a Group</Text>
                    <Text style={styles.createGroupDesc}>
                      Start your own community
                    </Text>
                  </View>
                </Pressable>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Search size={32} color="#4A90A4" />
              </View>
              <Text style={styles.emptyTitle}>Find your crew</Text>
              <Text style={styles.emptyDesc}>
                Tap Discover to join groups and meet in person
              </Text>
              <Pressable
                onPress={() => setShowCreateGroup(true)}
                style={styles.emptyCreateBtn}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyCreateBtnText}>Create a Group</Text>
              </Pressable>
            </View>
          )
        ) : (
          /* ─── Discover Tab ─── */
          <View style={styles.discoverContainer}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#9CA3AF" />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search groups..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
            </View>

            {/* Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {allCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryPill,
                      isSelected && styles.categoryPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected && styles.categoryPillTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Grid */}
            <FlatList
              data={discoverGroups}
              keyExtractor={(item) => item.id}
              renderItem={renderDiscoverItem}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.discoverGrid}
              columnWrapperStyle={styles.gridRow}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>Nothing here yet</Text>
                  <Text style={styles.emptyDesc}>
                    Try another search or start your own group
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* FAB */}
      <Fab onPress={() => setShowCreateGroup(true)} accessibilityLabel="Create new group" />

      {/* Group Detail Overlay */}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },

  // Tab Switcher
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
    color: "#A0AEC0",
  },

  // Content
  content: {
    flex: 1,
  },
  myGroupsList: {
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Discover Tab
  discoverContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    minHeight: 48,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  categoryPillSelected: {
    backgroundColor: "#1A365D",
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
  },
  categoryPillTextSelected: {
    color: "#FFFFFF",
  },
  discoverGrid: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: "space-between",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },

  // Create Group card
  createGroupCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    backgroundColor: "#FAFBFC",
  },
  createGroupCardPressed: {
    backgroundColor: "#F0F4F8",
  },
  createGroupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A365D",
    alignItems: "center",
    justifyContent: "center",
  },
  createGroupText: {
    flex: 1,
    gap: 2,
  },
  createGroupTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
  },
  createGroupDesc: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },

  // Empty state create button
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    backgroundColor: "#1A365D",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: 44,
  },
  emptyCreateBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },

});
