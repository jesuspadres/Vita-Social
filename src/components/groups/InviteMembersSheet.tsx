import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Search, Check } from "lucide-react-native";
import { COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InvitableUser {
  id: string;
  name: string;
  avatar: string;
  mutualFriends: number;
}

export interface InviteMembersSheetProps {
  visible: boolean;
  onClose: () => void;
  groupName: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_INVITABLE_USERS: InvitableUser[] = [
  {
    id: "inv-1",
    name: "Priya Sharma",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=PriyaSharma",
    mutualFriends: 5,
  },
  {
    id: "inv-2",
    name: "Liam O'Brien",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=LiamOBrien",
    mutualFriends: 3,
  },
  {
    id: "inv-3",
    name: "Mei Lin",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=MeiLin",
    mutualFriends: 8,
  },
  {
    id: "inv-4",
    name: "Andre Williams",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=AndreWilliams",
    mutualFriends: 2,
  },
  {
    id: "inv-5",
    name: "Sophie Laurent",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=SophieLaurent",
    mutualFriends: 6,
  },
  {
    id: "inv-6",
    name: "Noah Tanaka",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=NoahTanaka",
    mutualFriends: 4,
  },
];

// ---------------------------------------------------------------------------
// User Row
// ---------------------------------------------------------------------------

function UserRow({
  user,
  selected,
  onToggle,
}: {
  user: InvitableUser;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggle(user.id)}
      style={[s.userRow, selected && s.userRowSelected]}
    >
      <Image source={{ uri: user.avatar }} style={s.avatar} />
      <View style={s.userInfo}>
        <Text style={s.userName}>{user.name}</Text>
        <Text style={s.userMutual}>{user.mutualFriends} mutual friends</Text>
      </View>
      <View style={[s.checkbox, selected && s.checkboxSelected]}>
        {selected && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function InviteMembersSheet({
  visible,
  onClose,
  groupName,
}: InviteMembersSheetProps) {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset when sheet opens
  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setSelectedIds(new Set());
    }
  }, [visible]);

  // Animated slide-up
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezierFn(0.22, 1, 0.36, 1),
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(300, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_INVITABLE_USERS;
    const q = searchQuery.toLowerCase();
    return MOCK_INVITABLE_USERS.filter((u) =>
      u.name.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Toggle selection
  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Send invites
  const handleSendInvites = useCallback(() => {
    toast(
      `${selectedIds.size} invite${selectedIds.size !== 1 ? "s" : ""} sent!`,
      "success",
    );
    onClose();
  }, [selectedIds.size, toast, onClose]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex1}
      >
        <View style={s.flex1justifyEnd}>
          {/* Backdrop */}
          <Animated.View style={[s.backdrop, backdropStyle]}>
            <Pressable style={s.flex1} onPress={onClose} />
          </Animated.View>

          {/* Panel */}
          <Animated.View
            style={[
              s.panel,
              panelStyle,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            {/* Drag handle */}
            <View style={s.dragHandle}>
              <View style={s.dragBar} />
            </View>

            {/* Title */}
            <Text style={s.title} numberOfLines={1}>
              Invite to {groupName}
            </Text>

            {/* Search bar */}
            <View style={s.searchContainer}>
              <Search size={18} color="#A0AEC0" strokeWidth={1.75} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search connections..."
                placeholderTextColor="#A0AEC0"
                style={s.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* User list */}
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserRow
                  user={item}
                  selected={selectedIds.has(item.id)}
                  onToggle={handleToggle}
                />
              )}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={s.list}
            />

            {/* Bottom bar */}
            <View style={s.bottomBar}>
              <Text style={s.selectedCount}>
                {selectedIds.size} selected
              </Text>
              <Pressable
                onPress={handleSendInvites}
                disabled={selectedIds.size === 0}
                style={[
                  s.sendBtn,
                  selectedIds.size === 0 && s.sendBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    s.sendBtnText,
                    selectedIds.size === 0 && s.sendBtnTextDisabled,
                  ]}
                >
                  Send Invites
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

InviteMembersSheet.displayName = "InviteMembersSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  flex1justifyEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },

  // Backdrop
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // Panel
  panel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },

  // Drag handle
  dragHandle: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },

  // Title
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F9FAFB",
    minHeight: 44,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: "#111827",
    fontFamily: "Inter_400Regular",
    padding: 0,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // User row
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 2,
  },
  userRowSelected: {
    backgroundColor: "rgba(74,144,164,0.06)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  userMutual: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#718096",
    fontFamily: "Inter_500Medium",
  },
  sendBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    minHeight: 44,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  sendBtnTextDisabled: {
    color: "#A0AEC0",
  },
});
