import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ImageIcon, Link2, MapPin } from "lucide-react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Avatar } from "@/components/ui/avatar";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARS = 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateGroupPostSheetProps {
  visible: boolean;
  onClose: () => void;
  groupName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateGroupPostSheet({
  visible,
  onClose,
  groupName,
}: CreateGroupPostSheetProps) {
  const insets = useSafeAreaInsets();
  const [postText, setPostText] = useState("");

  const charCount = postText.length;
  const canPost = postText.trim().length > 0;

  const handleClose = useCallback(() => {
    setPostText("");
    onClose();
  }, [onClose]);

  const handlePost = useCallback(() => {
    if (!canPost) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPostText("");
    onClose();
  }, [canPost, onClose]);

  const handleToolbarPress = useCallback((tool: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Placeholder for future functionality
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.modalContainer}
      >
        {/* Backdrop */}
        <Pressable style={s.backdrop} onPress={handleClose} />

        {/* Panel */}
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={[s.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          {/* Drag Handle */}
          <View style={s.dragHandle}>
            <View style={s.dragBar} />
          </View>

          {/* Header */}
          <View style={s.header}>
            <Pressable
              onPress={handleClose}
              hitSlop={8}
              style={s.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={22} color="#6B7280" />
            </Pressable>
            <Text style={s.headerTitle}>New Post</Text>
            <Pressable
              onPress={handlePost}
              disabled={!canPost}
              style={[s.postButton, !canPost && s.postButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Publish post"
            >
              <Text style={[s.postButtonText, !canPost && s.postButtonTextDisabled]}>
                Post
              </Text>
            </Pressable>
          </View>

          {/* Author Row */}
          <View style={s.authorRow}>
            <Avatar
              size="md"
              src="https://api.dicebear.com/8.x/avataaars/png?seed=MayaChen"
              name="Maya Chen"
            />
            <View style={s.authorInfo}>
              <Text style={s.authorName}>Maya Chen</Text>
              <Text style={s.authorGroup}>Posting in {groupName}</Text>
            </View>
          </View>

          {/* Text Input */}
          <TextInput
            value={postText}
            onChangeText={setPostText}
            placeholder="Share something with the group..."
            placeholderTextColor="#9CA3AF"
            style={s.textInput}
            multiline
            maxLength={MAX_CHARS}
            autoFocus
            textAlignVertical="top"
          />

          {/* Bottom Section */}
          <View style={s.bottomSection}>
            {/* Toolbar */}
            <View style={s.toolbar}>
              <Pressable
                onPress={() => handleToolbarPress("image")}
                style={s.toolbarButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add photo"
              >
                <ImageIcon size={22} color="#6B7280" />
              </Pressable>
              <Pressable
                onPress={() => handleToolbarPress("link")}
                style={s.toolbarButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add link"
              >
                <Link2 size={22} color="#6B7280" />
              </Pressable>
              <Pressable
                onPress={() => handleToolbarPress("location")}
                style={s.toolbarButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Tag location"
              >
                <MapPin size={22} color="#6B7280" />
              </Pressable>

              {/* Character Counter */}
              <View style={s.charCountContainer}>
                <Text
                  style={[
                    s.charCount,
                    charCount > MAX_CHARS * 0.9 && s.charCountWarning,
                    charCount >= MAX_CHARS && s.charCountDanger,
                  ]}
                >
                  {charCount}/{MAX_CHARS}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

CreateGroupPostSheet.displayName = "CreateGroupPostSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },

  // Drag Handle
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
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  postButtonTextDisabled: {
    color: "#A0AEC0",
  },

  // Author Row
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },
  authorGroup: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Text Input
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    lineHeight: 22,
  },

  // Bottom Section
  bottomSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  toolbarButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  charCountContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  charCount: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
  charCountWarning: {
    color: COLORS.warning,
  },
  charCountDanger: {
    color: COLORS.danger,
  },
});
