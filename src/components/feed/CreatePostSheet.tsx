import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { ImageIcon, X } from "lucide-react-native";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { mockGroups } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatePostSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const joinedGroups = mockGroups.filter((g) => g.is_member);

export function CreatePostSheet({ visible, onClose }: CreatePostSheetProps) {
  const [content, setContent] = useState("");
  const [hasImage, setHasImage] = useState(false);
  const [postTo, setPostTo] = useState<string>("feed");

  const isValid = content.trim().length >= 1;

  const handlePost = useCallback(() => {
    if (!isValid) return;

    const target =
      postTo === "feed"
        ? "your feed"
        : joinedGroups.find((g) => g.id === postTo)?.name ?? "your feed";

    Alert.alert("Post Created!", `Your post has been shared to ${target}.`, [
      { text: "OK", onPress: onClose },
    ]);

    setContent("");
    setHasImage(false);
    setPostTo("feed");
  }, [isValid, postTo, onClose]);

  return (
    <Modal visible={visible} onClose={onClose} title="Create Post">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Content Input */}
        <View style={styles.field}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            style={styles.textArea}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{content.length}/500</Text>
        </View>

        {/* Image Toggle */}
        <View style={styles.field}>
          {!hasImage ? (
            <Pressable
              style={styles.imageButton}
              onPress={() => setHasImage(true)}
            >
              <ImageIcon size={18} color="#4A90A4" />
              <Text style={styles.imageButtonText}>Add Photo</Text>
            </Pressable>
          ) : (
            <View>
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={32} color="#9CA3AF" />
                <Text style={styles.imagePlaceholderText}>Photo attached</Text>
              </View>
              <Pressable
                onPress={() => setHasImage(false)}
                style={styles.removeImage}
                hitSlop={8}
              >
                <X size={14} color="#E53E3E" />
                <Text style={styles.removeImageText}>Remove</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Post To Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Post to</Text>
          <View style={styles.postToRow}>
            <Pressable
              onPress={() => setPostTo("feed")}
              style={[
                styles.postToPill,
                postTo === "feed" && styles.postToPillSelected,
              ]}
            >
              <Text
                style={[
                  styles.postToPillText,
                  postTo === "feed" && styles.postToPillTextSelected,
                ]}
              >
                My Feed
              </Text>
            </Pressable>
            {joinedGroups.map((group) => {
              const isSelected = postTo === group.id;
              return (
                <Pressable
                  key={group.id}
                  onPress={() => setPostTo(isSelected ? "feed" : group.id)}
                  style={[
                    styles.postToPill,
                    isSelected && styles.postToPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.postToPillText,
                      isSelected && styles.postToPillTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {group.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Post Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handlePost}
            disabled={!isValid}
          >
            Post
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
}

CreatePostSheet.displayName = "CreatePostSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  field: {
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },

  // Image
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
  },
  imagePlaceholder: {
    backgroundColor: "#F3F4F6",
    height: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  removeImage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  removeImageText: {
    fontSize: 12,
    color: "#E53E3E",
    fontFamily: "Inter_500Medium",
  },

  // Post To
  postToRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  postToPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  postToPillSelected: {
    backgroundColor: "#1A365D",
    borderColor: "#1A365D",
  },
  postToPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter_500Medium",
  },
  postToPillTextSelected: {
    color: "#FFFFFF",
  },

  buttonContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
});
