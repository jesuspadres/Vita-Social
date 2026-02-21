import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInLeft,
  FadeOutLeft,
  FadeOutRight,
} from "react-native-reanimated";
import {
  ArrowLeft,
  Calendar,
  Plus,
  X,
  Check,
  Search,
  Users,
  MapPin,
} from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5;

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

const MIN_INTERESTS = 3;
const MAX_BIO = 500;
const MAX_PHOTOS = 6;
const MIN_PHOTOS = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  firstName: string;
  photos: string[];
  bio: string;
  gender: string;
  birthday: string;
  interests: string[];
}

// ---------------------------------------------------------------------------
// Sub-Components
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
    <View style={styles.photoSlot}>
      {photo ? (
        <View style={styles.photoFilled}>
          <Image
            source={{ uri: photo }}
            style={styles.photoImage}
            resizeMode="cover"
          />
          <Pressable
            onPress={() => onRemove(index)}
            style={styles.photoRemoveBtn}
            hitSlop={12}
          >
            <X size={12} color="#FFFFFF" />
          </Pressable>
          {index === 0 && (
            <View style={styles.photoMainBadge}>
              <Text style={styles.photoMainText}>Main</Text>
            </View>
          )}
        </View>
      ) : (
        <Pressable onPress={onAdd} style={styles.photoEmpty}>
          <View style={styles.photoAddCircle}>
            <Plus size={18} color="#A0AEC0" />
          </View>
          <Text style={styles.photoAddText}>Add</Text>
        </Pressable>
      )}
    </View>
  );
}

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
        styles.interestChip,
        selected ? styles.interestChipSelected : styles.interestChipUnselected,
      ]}
    >
      <Text
        style={[
          styles.interestChipText,
          selected
            ? styles.interestChipTextSelected
            : styles.interestChipTextUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Birthday Picker Constants
// ---------------------------------------------------------------------------

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const ITEM_HEIGHT = 44;

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns the current year minus 18 (maximum birth year for 18+). */
function getMaxBirthYear(): number {
  return new Date().getFullYear() - 18;
}

/** Returns the minimum birth year (65 years back from current year). */
function getMinBirthYear(): number {
  return new Date().getFullYear() - 65;
}

function formatBirthday(month: number, day: number, year: number): string {
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

// ---------------------------------------------------------------------------
// Birthday Picker Column
// ---------------------------------------------------------------------------

function PickerColumn({
  data,
  selectedValue,
  onSelect,
  keyPrefix,
}: {
  data: { label: string; value: number }[];
  selectedValue: number;
  onSelect: (value: number) => void;
  keyPrefix: string;
}) {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const idx = data.findIndex((d) => d.value === selectedValue);
    if (idx >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: false, viewPosition: 0.5 });
    }
  }, []); // scroll to initial position on mount only

  return (
    <View style={pickerStyles.column}>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => `${keyPrefix}-${item.value}`}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        renderItem={({ item }) => {
          const isSelected = item.value === selectedValue;
          return (
            <Pressable
              onPress={() => onSelect(item.value)}
              style={[
                pickerStyles.item,
                isSelected && pickerStyles.itemSelected,
              ]}
            >
              <Text
                style={[
                  pickerStyles.itemText,
                  isSelected && pickerStyles.itemTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

PickerColumn.displayName = "PickerColumn";

// ---------------------------------------------------------------------------
// Birthday Picker Sheet
// ---------------------------------------------------------------------------

function BirthdayPickerSheet({
  visible,
  onClose,
  onConfirm,
  initialMonth,
  initialDay,
  initialYear,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (month: number, day: number, year: number) => void;
  initialMonth: number;
  initialDay: number;
  initialYear: number;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);
  const [year, setYear] = useState(initialYear);

  const maxBirthYear = getMaxBirthYear();
  const minBirthYear = getMinBirthYear();

  const monthData = useMemo(
    () => MONTHS.map((m, i) => ({ label: m, value: i + 1 })),
    [],
  );

  const yearData = useMemo(() => {
    const years: { label: string; value: number }[] = [];
    for (let y = maxBirthYear; y >= minBirthYear; y--) {
      years.push({ label: String(y), value: y });
    }
    return years;
  }, [maxBirthYear, minBirthYear]);

  const daysCount = getDaysInMonth(month, year);

  const dayData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let d = 1; d <= daysCount; d++) {
      days.push({ label: String(d), value: d });
    }
    return days;
  }, [daysCount]);

  // Clamp day if month/year changes make current day invalid
  useEffect(() => {
    if (day > daysCount) {
      setDay(daysCount);
    }
  }, [daysCount, day]);

  // Validate age is at least 18
  const isValid = useMemo(() => {
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  }, [month, day, year]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={pickerStyles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      <View style={pickerStyles.sheetContainer}>
        {/* Drag handle */}
        <View style={pickerStyles.handleRow}>
          <View style={pickerStyles.handle} />
        </View>

        {/* Header */}
        <View style={pickerStyles.header}>
          <Text style={pickerStyles.headerTitle}>Select Birthday</Text>
          <Text style={pickerStyles.headerSubtitle}>
            You must be at least 18 years old
          </Text>
        </View>

        {/* Picker Columns */}
        <View style={pickerStyles.columnsRow}>
          <PickerColumn
            data={monthData}
            selectedValue={month}
            onSelect={setMonth}
            keyPrefix="month"
          />
          <PickerColumn
            data={dayData}
            selectedValue={day}
            onSelect={setDay}
            keyPrefix="day"
          />
          <PickerColumn
            data={yearData}
            selectedValue={year}
            onSelect={setYear}
            keyPrefix="year"
          />
        </View>

        {/* Preview */}
        <View style={pickerStyles.previewRow}>
          <Text style={pickerStyles.previewText}>
            {formatBirthday(month, day, year)}
          </Text>
          {!isValid && (
            <Text style={pickerStyles.errorText}>
              Must be 18 or older
            </Text>
          )}
        </View>

        {/* Confirm button */}
        <View style={pickerStyles.confirmRow}>
          <Pressable
            onPress={() => {
              if (isValid) {
                onConfirm(month, day, year);
              }
            }}
            disabled={!isValid}
            style={[
              pickerStyles.confirmBtn,
              !isValid && pickerStyles.confirmBtnDisabled,
            ]}
          >
            <Text
              style={[
                pickerStyles.confirmBtnText,
                !isValid && pickerStyles.confirmBtnTextDisabled,
              ]}
            >
              Confirm
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

BirthdayPickerSheet.displayName = "BirthdayPickerSheet";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    photos: [],
    bio: "",
    gender: "",
    birthday: "",
    interests: [],
  });

  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  // ── Validation ──
  const canAdvance = useMemo(() => {
    switch (step) {
      case 1:
        return formData.firstName.trim().length >= 1;
      case 2:
        return formData.photos.length >= MIN_PHOTOS;
      case 3:
        return true; // bio + gender + birthday are optional enough to proceed
      case 4:
        return formData.interests.length >= MIN_INTERESTS;
      case 5:
        return true; // final step, always can proceed
      default:
        return false;
    }
  }, [step, formData]);

  // ── Form data updater ──
  const updateForm = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ── Navigation ──
  const goNext = useCallback(() => {
    if (!canAdvance) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [canAdvance, step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const finishOnboarding = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(main)/(tabs)/discover");
  }, [router]);

  // ── Interest toggling ──
  const toggleInterest = useCallback((interest: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData((prev) => {
      const has = prev.interests.includes(interest);
      if (has) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      }
      return { ...prev, interests: [...prev.interests, interest] };
    });
  }, []);

  // ── Photo handling ──
  const addPhoto = useCallback(async () => {
    if (formData.photos.length >= MAX_PHOTOS) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, result.assets[0].uri],
        }));
      }
    } catch {
      // Fallback for simulators / mock mode
      const seed = `user_${Date.now()}`;
      const mockUri = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, mockUri],
      }));
    }
  }, [formData.photos.length]);

  const removePhoto = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }, []);

  // ── Transition animations ──
  const entering = direction > 0 ? FadeInRight.duration(350) : FadeInLeft.duration(350);
  const exiting = direction > 0 ? FadeOutLeft.duration(250) : FadeOutRight.duration(250);

  // ── Progress bar width ──
  const progressPercent = (step / TOTAL_STEPS) * 100;

  // Optional steps (where skip is shown)
  const isOptionalStep = step === 3;

  // ── Step renderers ──

  function renderStep1() {
    return (
      <View style={styles.stepContent}>
        {/* Illustration area */}
        <View style={styles.welcomeIllustration}>
          <View style={styles.illustrationCircle} />
        </View>

        <Text style={styles.vitaTitle}>Vita</Text>
        <Text style={styles.vitaTagline}>
          The bridge from the screen to the scene.
        </Text>

        <TextInput
          style={[
            styles.nameInput,
            formData.firstName
              ? { borderColor: COLORS.secondary }
              : { borderColor: "#E2E8F0" },
          ]}
          value={formData.firstName}
          onChangeText={(text) => updateForm("firstName", text.slice(0, 30))}
          placeholder="What's your first name?"
          placeholderTextColor="#CBD5E0"
          autoFocus
          maxLength={30}
          returnKeyType="done"
          selectionColor={COLORS.secondary}
        />
      </View>
    );
  }

  function renderStep2() {
    // Build a 6-slot array
    const slots: (string | null)[] = [];
    for (let i = 0; i < MAX_PHOTOS; i++) {
      slots.push(formData.photos[i] ?? null);
    }

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>Show your best self</Text>
        <Text style={styles.stepSubtext}>
          Add at least 1 photo to get started
        </Text>

        <View style={styles.photoGrid}>
          {slots.map((uri, index) => (
            <PhotoSlot
              key={index}
              photo={uri}
              index={index}
              onAdd={addPhoto}
              onRemove={removePhoto}
            />
          ))}
        </View>
      </View>
    );
  }

  function renderStep3() {
    const charCount = formData.bio.length;

    return (
      <ScrollView
        style={styles.stepScrollView}
        contentContainerStyle={styles.stepScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepHeading}>A little about you</Text>

        {/* Bio */}
        <View style={styles.formSection}>
          <View>
            <TextInput
              style={[styles.bioInput, { borderColor: formData.bio ? COLORS.secondary : "#E2E8F0" }]}
              value={formData.bio}
              onChangeText={(text) => {
                if (text.length <= MAX_BIO) {
                  updateForm("bio", text);
                }
              }}
              placeholder="Tell others about yourself..."
              placeholderTextColor="#CBD5E0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={MAX_BIO}
              selectionColor={COLORS.secondary}
            />
            <Text
              style={[
                styles.bioCounter,
                charCount > MAX_BIO * 0.9 && { color: COLORS.danger },
              ]}
            >
              {charCount}/{MAX_BIO}
            </Text>
          </View>
        </View>

        {/* Gender */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateForm("gender", opt.value);
                }}
                style={[
                  styles.genderBtn,
                  formData.gender === opt.value
                    ? styles.genderBtnSelected
                    : styles.genderBtnUnselected,
                ]}
              >
                <Text
                  style={[
                    styles.genderBtnText,
                    formData.gender === opt.value
                      ? styles.genderBtnTextSelected
                      : styles.genderBtnTextUnselected,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Birthday */}
        <View style={styles.formSection}>
          <Pressable
            style={[
              styles.birthdayRow,
              formData.birthday
                ? { borderColor: COLORS.secondary }
                : { borderColor: "#E2E8F0" },
            ]}
            onPress={() => setShowBirthdayPicker(true)}
          >
            <Calendar size={20} color="#718096" strokeWidth={1.75} />
            <Text
              style={[
                styles.birthdayLabel,
                !formData.birthday && { color: "#CBD5E0" },
              ]}
            >
              {formData.birthday || "Select birthday"}
            </Text>
            <View style={{ marginLeft: "auto" }}>
              <Text style={styles.birthdayChevron}>{">"}</Text>
            </View>
          </Pressable>
        </View>

        {/* Birthday Picker Sheet */}
        <BirthdayPickerSheet
          visible={showBirthdayPicker}
          onClose={() => setShowBirthdayPicker(false)}
          initialMonth={1}
          initialDay={1}
          initialYear={getMaxBirthYear()}
          onConfirm={(month, day, year) => {
            updateForm("birthday", formatBirthday(month, day, year));
            setShowBirthdayPicker(false);
          }}
        />
      </ScrollView>
    );
  }

  function renderStep4() {
    const count = formData.interests.length;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>What are you into?</Text>
        <Text style={styles.stepSubtext}>Select at least 3 interests</Text>

        <Text style={styles.interestCounter}>
          {count} selected
        </Text>

        <ScrollView
          style={styles.interestScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.interestScrollContent}
        >
          <View style={styles.interestsGrid}>
            {ALL_INTERESTS.map((interest) => (
              <InterestChip
                key={interest}
                label={interest}
                selected={formData.interests.includes(interest)}
                onToggle={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  function renderStep5() {
    return (
      <View style={[styles.stepContent, styles.centeredStep]}>
        {/* Success checkmark */}
        <View style={styles.successCircle}>
          <Check size={48} color={COLORS.success} strokeWidth={2.5} />
        </View>

        <Text style={styles.successTitle}>Welcome to Vita!</Text>
        <Text style={styles.successSubtitle}>
          Your profile is ready. Time to start connecting.
        </Text>

        {/* Feature highlights */}
        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconCircle}>
              <Search size={20} color={COLORS.secondary} strokeWidth={1.75} />
            </View>
            <Text style={styles.featureText}>
              Discover people who share your passions
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIconCircle}>
              <Users size={20} color={COLORS.secondary} strokeWidth={1.75} />
            </View>
            <Text style={styles.featureText}>
              Join groups and build your health ring
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIconCircle}>
              <MapPin size={20} color={COLORS.secondary} strokeWidth={1.75} />
            </View>
            <Text style={styles.featureText}>
              Find events and check in to earn your streak
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Step renderer dispatch ──
  function renderCurrentStep() {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  }

  // ── Main Render ──
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* Header: Progress bar + Back/Skip */}
        <View style={styles.header}>
          {/* Top row: Back + Skip */}
          <View style={styles.headerTop}>
            {step > 1 ? (
              <Pressable
                onPress={goBack}
                style={styles.backButton}
                hitSlop={12}
              >
                <ArrowLeft size={20} color={COLORS.primary} strokeWidth={2} />
              </Pressable>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}

            {isOptionalStep ? (
              <Pressable onPress={goNext} hitSlop={8}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` as unknown as number },
              ]}
            />
          </View>
        </View>

        {/* Step Content (animated) */}
        <View style={styles.stepWrapper}>
          <Animated.View
            key={step}
            entering={entering}
            exiting={exiting}
            style={styles.flex}
          >
            {renderCurrentStep()}
          </Animated.View>
        </View>

        {/* Bottom: Continue / Let's Go button */}
        <View style={styles.bottomBar}>
          {step === 5 ? (
            <Pressable
              onPress={finishOnboarding}
              style={({ pressed }) => [
                styles.continueButton,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.continueButtonText}>Let's Go</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={goNext}
              disabled={!canAdvance}
              style={({ pressed }) => [
                styles.continueButton,
                !canAdvance && styles.continueButtonDisabled,
                pressed && canAdvance && { opacity: 0.9 },
              ]}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  !canAdvance && styles.continueButtonTextDisabled,
                ]}
              >
                Continue
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A0AEC0",
    fontFamily: "Inter_600SemiBold",
  },

  // Progress bar
  progressBarBg: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.secondary,
  },

  // Step wrapper
  stepWrapper: {
    flex: 1,
    overflow: "hidden",
  },

  // Step content
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  centeredStep: {
    alignItems: "center",
    paddingTop: 40,
  },

  // Step 1: Welcome
  welcomeIllustration: {
    alignItems: "center",
    marginBottom: 24,
  },
  illustrationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(74,144,164,0.1)",
  },
  vitaTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  vitaTagline: {
    fontSize: 16,
    fontWeight: "400",
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 32,
  },
  nameInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    color: COLORS.primary,
    textAlign: "center",
  },

  // Step heading / subtext
  stepHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A2D3D",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  stepSubtext: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 20,
  },

  // Step 2: Photos
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

  // Step 3: About you
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
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
  bioInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingTop: 12,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    backgroundColor: "#FFFFFF",
    minHeight: 100,
    textAlignVertical: "top",
  },
  bioCounter: {
    position: "absolute",
    bottom: 10,
    right: 12,
    fontSize: 11,
    color: "#A0AEC0",
    fontVariant: ["tabular-nums"],
  },
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
  birthdayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
  },
  birthdayLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  birthdayChevron: {
    fontSize: 16,
    color: "#CBD5E0",
  },

  // Step 4: Interests
  interestCounter: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  interestScroll: {
    flex: 1,
  },
  interestScrollContent: {
    paddingBottom: 24,
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
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
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

  // Step 5: Success
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(56,161,105,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featureList: {
    gap: 16,
    width: "100%",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(74,144,164,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter_500Medium",
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  continueButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  continueButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  continueButtonTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
});

// ---------------------------------------------------------------------------
// Birthday Picker Styles
// ---------------------------------------------------------------------------

const pickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  columnsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    height: 220,
    gap: 8,
  },
  column: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    overflow: "hidden",
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  itemSelected: {
    backgroundColor: COLORS.primary,
  },
  itemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4A5568",
    fontFamily: "Inter_500Medium",
  },
  itemTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  previewRow: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 24,
  },
  previewText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    fontSize: 12,
    color: "#E53E3E",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  confirmRow: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  confirmBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  confirmBtnTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
});
