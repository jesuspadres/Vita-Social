import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
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
import { Camera } from "lucide-react-native";
import { COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_CATEGORIES = [
  "Social",
  "Sports",
  "Outdoors",
  "Arts",
  "Food",
  "Tech",
  "Wellness",
  "Music",
  "Gaming",
  "Book Club",
] as const;

const NAME_MAX = 50;
const DESC_MAX = 200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditGroupInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  group: {
    name: string;
    description: string;
    category: string;
    cover_url: string | null;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditGroupInfoSheet({
  visible,
  onClose,
  group,
}: EditGroupInfoSheetProps) {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [category, setCategory] = useState(group.category);

  // Reset form when sheet opens
  React.useEffect(() => {
    if (visible) {
      setName(group.name);
      setDescription(group.description);
      setCategory(group.category);
    }
  }, [visible, group.name, group.description, group.category]);

  // Animated slide-up
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
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

  const handleSave = useCallback(() => {
    toast("Changes saved!", "success");
    onClose();
  }, [toast, onClose]);

  const handleChangePhoto = useCallback(() => {
    toast("Photo picker coming soon", "info");
  }, [toast]);

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
            <Text style={s.title}>Edit Group Info</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={s.scrollView}
            >
              {/* Form card */}
              <View style={s.formCard}>
                {/* Group Name */}
                <View style={s.fieldContainer}>
                  <View style={s.labelRow}>
                    <Text style={s.label}>Group Name</Text>
                    <Text style={s.charCount}>
                      {name.length}/{NAME_MAX}
                    </Text>
                  </View>
                  <TextInput
                    value={name}
                    onChangeText={(text) =>
                      setName(text.slice(0, NAME_MAX))
                    }
                    style={s.textInput}
                    placeholder="Enter group name"
                    placeholderTextColor="#A0AEC0"
                    maxLength={NAME_MAX}
                  />
                </View>

                <View style={s.divider} />

                {/* Description */}
                <View style={s.fieldContainer}>
                  <View style={s.labelRow}>
                    <Text style={s.label}>Description</Text>
                    <Text style={s.charCount}>
                      {description.length}/{DESC_MAX}
                    </Text>
                  </View>
                  <TextInput
                    value={description}
                    onChangeText={(text) =>
                      setDescription(text.slice(0, DESC_MAX))
                    }
                    style={[s.textInput, s.textInputMultiline]}
                    placeholder="Describe your group"
                    placeholderTextColor="#A0AEC0"
                    multiline
                    maxLength={DESC_MAX}
                    textAlignVertical="top"
                  />
                </View>

                <View style={s.divider} />

                {/* Category */}
                <View style={s.fieldContainer}>
                  <Text style={s.label}>Category</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.categoryScrollContent}
                    style={s.categoryScroll}
                  >
                    {GROUP_CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setCategory(cat)}
                          style={[
                            s.categoryPill,
                            isSelected
                              ? s.categoryPillSelected
                              : s.categoryPillUnselected,
                          ]}
                        >
                          <Text
                            style={[
                              s.categoryPillText,
                              isSelected
                                ? s.categoryPillTextSelected
                                : s.categoryPillTextUnselected,
                            ]}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={s.divider} />

                {/* Cover Photo */}
                <View style={s.fieldContainer}>
                  <Text style={s.label}>Cover Photo</Text>
                  <View style={s.coverPhotoRow}>
                    <View style={s.coverThumbnail}>
                      <Camera
                        size={20}
                        color="#A0AEC0"
                        strokeWidth={1.75}
                      />
                    </View>
                    <Pressable
                      onPress={handleChangePhoto}
                      style={s.changePhotoBtn}
                    >
                      <Text style={s.changePhotoText}>Change Photo</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Bottom actions */}
            <View style={s.bottomActions}>
              <Pressable
                onPress={onClose}
                style={s.cancelBtn}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={s.saveBtn}
              >
                <Text style={s.saveBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

EditGroupInfoSheet.displayName = "EditGroupInfoSheet";

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
    maxHeight: "92%",
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
    paddingBottom: 16,
  },

  // Scroll
  scrollView: {
    paddingHorizontal: 20,
  },

  // Form card
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },

  // Field
  fieldContainer: {
    paddingVertical: 12,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
  },
  charCount: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },

  // Text inputs
  textInput: {
    fontSize: 14,
    fontWeight: "400",
    color: "#111827",
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    backgroundColor: "#F9FAFB",
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  // Category pills
  categoryScroll: {
    marginTop: 4,
  },
  categoryScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  categoryPillSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  categoryPillUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  categoryPillTextSelected: {
    color: "#FFFFFF",
  },
  categoryPillTextUnselected: {
    color: "#374151",
  },

  // Cover photo
  coverPhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  coverThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  changePhotoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    minHeight: 36,
    justifyContent: "center",
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.secondary,
    fontFamily: "Inter_600SemiBold",
  },

  // Bottom actions
  bottomActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    backgroundColor: "transparent",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    backgroundColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
});
