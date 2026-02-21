import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, MessageCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import { Avatar } from "@/components/ui/avatar";
import { ConversationRow } from "@/components/messages/ConversationRow";
import { ChatThread } from "@/components/messages/ChatThread";
import {
  mockConversations,
  mockNewMatches,
  type MockConversation,
  type MockConversationUser,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Messages Screen
// ---------------------------------------------------------------------------

export default function MessagesScreen() {
  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<MockConversation | null>(null);
  const [selectedNewMatch, setSelectedNewMatch] =
    useState<MockConversationUser | null>(null);

  // Search bar height animation
  const searchHeight = useSharedValue(0);
  const searchOpacity = useSharedValue(0);

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    height: searchHeight.value,
    opacity: searchOpacity.value,
    overflow: "hidden" as const,
  }));

  const toggleSearch = useCallback(() => {
    if (searchActive) {
      // Close
      searchHeight.value = withTiming(0, { duration: 200 });
      searchOpacity.value = withTiming(0, { duration: 150 });
      setSearchText("");
    } else {
      // Open
      searchHeight.value = withTiming(52, { duration: 250 });
      searchOpacity.value = withTiming(1, { duration: 200 });
    }
    setSearchActive((prev) => !prev);
  }, [searchActive, searchHeight, searchOpacity]);

  // Filter conversations
  const sortedConversations = useMemo(() => {
    let convos = [...mockConversations].sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime(),
    );

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      convos = convos.filter(
        (c) =>
          c.user.first_name.toLowerCase().includes(query) ||
          c.last_message.toLowerCase().includes(query),
      );
    }

    return convos;
  }, [searchText]);

  // Handlers
  const handleConversationPress = useCallback(
    (conversation: MockConversation) => {
      setSelectedConversation(conversation);
    },
    [],
  );

  const handleNewMatchPress = useCallback(
    (matchUser: MockConversationUser) => {
      setSelectedNewMatch(matchUser);
    },
    [],
  );

  // Render helpers
  const renderConversation = useCallback(
    ({ item, index }: { item: MockConversation; index: number }) => (
      <ConversationRow
        conversation={item}
        onPress={handleConversationPress}
        index={index}
      />
    ),
    [handleConversationPress],
  );

  const renderNewMatch = useCallback(
    ({ item }: { item: MockConversationUser }) => (
      <Pressable
        onPress={() => handleNewMatchPress(item)}
        style={styles.matchItem}
      >
        <View style={styles.matchAvatarWrapper}>
          <LinearGradient
            colors={["#4A90A4", "#1A365D"]}
            style={styles.matchGradientRing}
          >
            <View style={styles.matchAvatarInner}>
              <Avatar size="lg" src={item.avatar_url} name={item.first_name} />
            </View>
          </LinearGradient>
          {/* New indicator dot */}
          <View style={styles.newDot} />
        </View>
        <Text style={styles.matchName} numberOfLines={1}>
          {item.first_name}
        </Text>
      </Pressable>
    ),
    [handleNewMatchPress],
  );

  const showNewMatches = !searchActive && mockNewMatches.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Pressable onPress={toggleSearch} hitSlop={12} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          {searchActive ? (
            <X size={22} color="#1A365D" />
          ) : (
            <Search size={22} color="#1A365D" />
          )}
        </Pressable>
      </View>

      {/* Animated Search Bar */}
      <Animated.View style={[styles.searchWrapper, searchAnimatedStyle]}>
        <View style={styles.searchContainer}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search messages..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoFocus={searchActive}
          />
        </View>
      </Animated.View>

      {/* Content */}
      <FlatList
        data={sortedConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          showNewMatches ? (
            <View style={styles.matchesSection}>
              <Text style={styles.matchesSectionTitle}>New Matches</Text>
              <FlatList
                data={mockNewMatches}
                keyExtractor={(item) => item.id}
                renderItem={renderNewMatch}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.matchesList}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MessageCircle size={32} color="#4A90A4" />
            </View>
            <Text style={styles.emptyTitle}>Your inbox awaits</Text>
            <Text style={styles.emptyDesc}>
              Swipe right on someone to start a conversation
            </Text>
          </View>
        }
      />

      {/* Chat Thread Overlay (from conversation) */}
      {selectedConversation && (
        <ChatThread
          user={selectedConversation.user}
          onBack={() => setSelectedConversation(null)}
        />
      )}

      {/* Chat Thread Overlay (from new match) */}
      {selectedNewMatch && (
        <ChatThread
          user={selectedNewMatch}
          isNewConversation
          onBack={() => setSelectedNewMatch(null)}
        />
      )}
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 14,
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

  // Conversations List
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },

  // New Matches Section
  matchesSection: {
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  matchesSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  matchesList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  matchItem: {
    alignItems: "center",
    width: 76,
  },
  matchAvatarWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  matchGradientRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  matchAvatarInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  newDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3182CE",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  matchName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 80,
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
});
