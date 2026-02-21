import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { X, Plus, User } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { CURRENT_USER_PROFILE } from "@/lib/mock-data";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BIO_LENGTH = 500;

const ALL_INTERESTS = [
  "Climbing",
  "Vinyl",
  "Coffee",
  "Live Music",
  "Design",
  "Yoga",
  "Photography",
  "Cooking",
  "Reading",
  "Running",
  "Travel",
  "Gaming",
  "Art",
  "Hiking",
  "Dancing",
  "Film",
  "Pets",
  "Volunteering",
  "Cycling",
  "Meditation",
  "Board Games",
  "Wine",
  "Tennis",
  "Gardening",
] as const;

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer-not", label: "Prefer not" },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Photo Slot
// ---------------------------------------------------------------------------

function PhotoSlot({
  photo,
  index,
  onAdd,
  onRemove,
}: {
  photo: string | null;
  index: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <View style={s.photoSlot}>
      {photo ? (
        <View style={s.photoFilled}>
          <Image
            source={{ uri: photo }}
            style={s.photoImage}
            resizeMode="cover"
          />
          {/* Remove button */}
          <Pressable
            onPress={() => onRemove(index)}
            style={s.photoRemoveBtn}
            hitSlop={12}
          >
            <X size={12} color="#FFFFFF" />
          </Pressable>
          {/* Main label */}
          {index === 0 && (
            <View style={s.photoMainBadge}>
              <Text style={s.photoMainText}>Main</Text>
            </View>
          )}
        </View>
      ) : (
        <Pressable onPress={onAdd} style={s.photoEmpty}>
          <View style={s.photoAddCircle}>
            <Plus size={18} color="#A0AEC0" />
          </View>
          <Text style={s.photoAddText}>Add</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Interest Chip
// ---------------------------------------------------------------------------

function InterestChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[
        s.interestChip,
        selected ? s.interestChipSelected : s.interestChipUnselected,
      ]}
    >
      <Text
        style={[
          s.interestChipText,
          selected
            ? s.interestChipTextSelected
            : s.interestChipTextUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
  const insets = useSafeAreaInsets();
  const profile = CURRENT_USER_PROFILE;

  // Form state
  const [firstName, setFirstName] = useState(profile.firstName);
  const [bio, setBio] = useState(profile.bio);
  const [gender, setGender] = useState(profile.gender as string);
  const [photos, setPhotos] = useState<(string | null)[]>(() => {
    const filled = [...profile.photos];
    while (filled.length < 6) filled.push(null as unknown as string);
    return filled as string[];
  });
  const [interests, setInterests] = useState<string[]>([...profile.interests]);
  const [saving, setSaving] = useState(false);

  const handleBioChange = useCallback((text: string) => {
    if (text.length <= MAX_BIO_LENGTH) {
      setBio(text);
    }
  }, []);

  const handleToggleInterest = useCallback((interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  }, []);

  const handleAddPhoto = useCallback(() => {
    setPhotos((prev) => {
      const copy = [...prev];
      const emptyIdx = copy.findIndex((p) => p === null);
      if (emptyIdx !== -1) {
        copy[emptyIdx] = `https://api.dicebear.com/9.x/avataaars/svg?seed=new-${Date.now()}`;
      }
      return copy;
    });
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const copy = [...prev];
      copy[index] = null;
      const filled = copy.filter(Boolean) as string[];
      const empties: null[] = Array(6 - filled.length).fill(null);
      return [...filled, ...empties];
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    onClose();
  }, [onClose]);

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
        style={s.modalRoot}
      >
        {/* Backdrop */}
        <Pressable style={s.backdrop} onPress={onClose}>
          <Animated.View
            entering={FadeIn.duration(250)}
            style={s.backdropFill}
          />
        </Pressable>

        {/* Panel */}
        <Animated.View
          entering={SlideInDown.duration(400).springify().damping(18)}
          exiting={SlideOutDown.duration(300)}
          style={[
            s.panel,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Drag handle */}
          <View style={s.dragHandle}>
            <View style={s.dragBar} />
          </View>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Edit Profile</Text>
            <Pressable
              onPress={onClose}
              style={s.closeBtn}
              hitSlop={8}
            >
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={s.scrollView}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Photo Grid ── */}
            <View style={s.formSection}>
              <Text style={s.formLabel}>Photos</Text>
              <View style={s.photoGrid}>
                {photos.map((photo, i) => (
                  <PhotoSlot
                    key={i}
                    photo={photo}
                    index={i}
                    onAdd={handleAddPhoto}
                    onRemove={handleRemovePhoto}
                  />
                ))}
              </View>
            </View>

            {/* ── First Name ── */}
            <View style={s.formSection}>
              <Text style={s.formLabel}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Your first name"
                placeholderTextColor="#A0AEC0"
                maxLength={50}
                style={s.textInput}
              />
            </View>

            {/* ── Bio ── */}
            <View style={s.formSection}>
              <Text style={s.formLabel}>Bio</Text>
              <View>
                <TextInput
                  value={bio}
                  onChangeText={handleBioChange}
                  placeholder="Tell others about yourself..."
                  placeholderTextColor="#A0AEC0"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[s.textInput, s.textArea]}
                />
                <Text
                  style={[
                    s.bioCounter,
                    bio.length > MAX_BIO_LENGTH * 0.9 && { color: COLORS.danger },
                  ]}
                >
                  {bio.length}/{MAX_BIO_LENGTH}
                </Text>
              </View>
            </View>

            {/* ── Gender ── */}
            <View style={s.formSection}>
              <Text style={s.formLabel}>Gender</Text>
              <View style={s.genderRow}>
                {GENDER_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setGender(opt.value)}
                    style={[
                      s.genderBtn,
                      gender === opt.value
                        ? s.genderBtnSelected
                        : s.genderBtnUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        s.genderBtnText,
                        gender === opt.value
                          ? s.genderBtnTextSelected
                          : s.genderBtnTextUnselected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Interests ── */}
            <View style={s.formSection}>
              <View style={s.interestsHeader}>
                <Text style={s.formLabel}>Interests</Text>
                <Text style={s.interestsCount}>
                  {interests.length} selected
                </Text>
              </View>
              <View style={s.interestsGrid}>
                {ALL_INTERESTS.map((interest) => (
                  <InterestChip
                    key={interest}
                    label={interest}
                    selected={interests.includes(interest)}
                    onToggle={() => handleToggleInterest(interest)}
                  />
                ))}
              </View>
            </View>

            {/* ── Save Button ── */}
            <View style={s.saveWrapper}>
              <Button
                fullWidth
                size="lg"
                loading={saving}
                onPress={handleSave}
              >
                Save Changes
              </Button>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

EditProfileSheet.displayName = "EditProfileSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    overflow: "hidden",
  },
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Photo grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoSlot: {
    width: "30.66%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoFilled: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoMainBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoMainText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  photoEmpty: {
    flex: 1,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoAddCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#A0AEC0",
  },

  // Form
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  bioCounter: {
    position: "absolute",
    bottom: 10,
    right: 12,
    fontSize: 11,
    color: "#A0AEC0",
    fontVariant: ["tabular-nums"],
  },

  // Gender
  genderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  genderBtnSelected: {
    backgroundColor: "#1A365D",
    borderColor: "#1A365D",
  },
  genderBtnUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  genderBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  genderBtnTextSelected: {
    color: "#FFFFFF",
  },
  genderBtnTextUnselected: {
    color: "#374151",
  },

  // Interests
  interestsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  interestsCount: {
    fontSize: 12,
    color: "#A0AEC0",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  interestChipSelected: {
    backgroundColor: "#4A90A4",
    borderColor: "#4A90A4",
  },
  interestChipUnselected: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E2E8F0",
  },
  interestChipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  interestChipTextSelected: {
    color: "#FFFFFF",
  },
  interestChipTextUnselected: {
    color: "#374151",
  },

  // Save
  saveWrapper: {
    marginTop: 12,
  },
});
