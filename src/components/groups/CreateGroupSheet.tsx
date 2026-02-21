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
import { Globe, Lock, EyeOff, Check } from "lucide-react-native";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { groupCategories } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateGroupSheetProps {
  visible: boolean;
  onClose: () => void;
}

type PrivacyTier = "public" | "private" | "secret";

// ---------------------------------------------------------------------------
// Privacy Options Config
// ---------------------------------------------------------------------------

interface PrivacyOption {
  key: PrivacyTier;
  label: string;
  description: string;
  Icon: typeof Globe;
}

const privacyOptions: PrivacyOption[] = [
  {
    key: "public",
    label: "Public",
    description: "Anyone can find and join",
    Icon: Globe,
  },
  {
    key: "private",
    label: "Private",
    description: "Visible but requires approval",
    Icon: Lock,
  },
  {
    key: "secret",
    label: "Secret",
    description: "Invite-only and hidden",
    Icon: EyeOff,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateGroupSheet({ visible, onClose }: CreateGroupSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyTier | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const isValid = name.trim().length >= 3 && privacy !== null;

  const handleCreate = useCallback(() => {
    if (!isValid) return;

    Alert.alert(
      "Group Created!",
      `"${name.trim()}" has been created successfully.`,
      [{ text: "OK", onPress: onClose }],
    );

    // Reset form
    setName("");
    setDescription("");
    setPrivacy(null);
    setCategory(null);
  }, [isValid, name, onClose]);

  return (
    <Modal visible={visible} onClose={onClose} title="Create Group">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter group name (min 3 characters)"
            placeholderTextColor="#9CA3AF"
            style={styles.textInput}
            maxLength={50}
          />
        </View>

        {/* Description Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What's your group about?"
            placeholderTextColor="#9CA3AF"
            style={[styles.textInput, styles.textArea]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={300}
          />
        </View>

        {/* Privacy Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Privacy *</Text>
          <View style={styles.privacyRow}>
            {privacyOptions.map((option) => {
              const isSelected = privacy === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setPrivacy(option.key)}
                  style={[
                    styles.privacyButton,
                    isSelected && styles.privacyButtonSelected,
                  ]}
                >
                  <option.Icon
                    size={18}
                    color={isSelected ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.privacyLabel,
                      isSelected && styles.privacyLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.privacyDesc,
                      isSelected && styles.privacyDescSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryRow}>
            {groupCategories.map((cat) => {
              const isSelected = category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(isSelected ? null : cat)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                >
                  {isSelected && <Check size={14} color="#FFFFFF" />}
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Create Button */}
        <View style={styles.createButtonContainer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleCreate}
            disabled={!isValid}
          >
            Create Group
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
}

CreateGroupSheet.displayName = "CreateGroupSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },

  // Privacy
  privacyRow: {
    gap: 8,
  },
  privacyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    minHeight: 48,
  },
  privacyButtonSelected: {
    backgroundColor: "#1A365D",
    borderColor: "#1A365D",
  },
  privacyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
    minWidth: 60,
  },
  privacyLabelSelected: {
    color: "#FFFFFF",
  },
  privacyDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  privacyDescSelected: {
    color: "rgba(255,255,255,0.7)",
  },

  // Categories
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 44,
  },
  categoryChipSelected: {
    backgroundColor: "#4A90A4",
    borderColor: "#4A90A4",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter_500Medium",
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
  },

  createButtonContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
});
