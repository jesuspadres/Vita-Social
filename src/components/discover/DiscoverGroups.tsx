import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Search } from "lucide-react-native";
import { GroupCard } from "@/components/groups/GroupCard";
import {
  mockGroups,
  groupCategories,
  type MockGroup,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DiscoverGroupsProps {
  onGroupPress: (group: MockGroup) => void;
  onJoinGroup: (group: MockGroup) => void;
}

// ---------------------------------------------------------------------------
// DiscoverGroups Component
// ---------------------------------------------------------------------------

export function DiscoverGroups({ onGroupPress, onJoinGroup }: DiscoverGroupsProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const allCategories = useMemo(() => ["All", ...groupCategories], []);

  const discoverGroups = useMemo(() => {
    let groups = mockGroups.filter((g) => !g.is_member);

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      groups = groups.filter((g) => g.name.toLowerCase().includes(query));
    }

    if (selectedCategory !== "All") {
      groups = groups.filter((g) => g.category === selectedCategory);
    }

    return groups;
  }, [searchText, selectedCategory]);

  const renderItem = useCallback(
    ({ item }: { item: MockGroup }) => (
      <GroupCard
        group={item}
        variant="grid"
        onPress={onGroupPress}
        onJoin={onJoinGroup}
      />
    ),
    [onGroupPress, onJoinGroup],
  );

  return (
    <View style={styles.container}>
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
        style={styles.categoryScrollContainer}
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
        renderItem={renderItem}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        style={styles.gridList}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No groups found</Text>
            <Text style={styles.emptyDesc}>
              Try a different search or category.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
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
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
  },
  categoryScrollContainer: {
    flexGrow: 0,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
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
  gridList: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
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
});

DiscoverGroups.displayName = "DiscoverGroups";
