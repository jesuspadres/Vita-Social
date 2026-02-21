import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
// expo-notifications removed — not supported in Expo Go (SDK 53+).
// Re-add when switching to a development build.
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInLeft,
  FadeOutLeft,
  FadeOutRight,
} from "react-native-reanimated";
import {
  User,
  Calendar,
  Users,
  Camera,
  Heart,
  MapPin,
  FileText,
  Bell,
  ArrowLeft,
  ChevronRight,
  Plus,
  X,
  Check,
} from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 8;

const STEP_ICONS = [User, Calendar, Users, Camera, Heart, MapPin, FileText, Bell];

const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Prefer not to say"] as const;

const INTEREST_CATEGORIES: Record<string, string[]> = {
  Outdoor: ["Hiking", "Running", "Cycling", "Climbing", "Yoga", "Surfing"],
  Music: ["Live Music", "Vinyl", "Guitar", "DJing", "Concerts"],
  Food: ["Coffee", "Cooking", "BBQ", "Wine", "Craft Beer"],
  Social: ["Board Games", "Trivia", "Volunteering", "Dogs", "Travel"],
  Creative: ["Photography", "Painting", "Design", "Writing", "Pottery"],
  Tech: ["Coding", "Startups", "AI", "Gaming"],
};

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;
const MAX_BIO = 200;
const MAX_PHOTOS = 6;
const MIN_PHOTOS = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  firstName: string;
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  gender: string;
  photos: string[];
  interests: string[];
  locationGranted: boolean | null;
  bio: string;
  notificationsGranted: boolean | null;
}

// ---------------------------------------------------------------------------
// Age calculation helper
// ---------------------------------------------------------------------------

function calculateAge(month: number, day: number, year: number): number | null {
  if (!month || !day || !year || year < 1900) return null;
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    birthMonth: "",
    birthDay: "",
    birthYear: "",
    gender: "",
    photos: [],
    interests: [],
    locationGranted: null,
    bio: "",
    notificationsGranted: null,
  });

  // ── Derived values ──────────────────────────────────────
  const age = useMemo(
    () =>
      calculateAge(
        parseInt(formData.birthMonth, 10),
        parseInt(formData.birthDay, 10),
        parseInt(formData.birthYear, 10),
      ),
    [formData.birthMonth, formData.birthDay, formData.birthYear],
  );

  // ── Validation ──────────────────────────────────────────
  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 0:
        return formData.firstName.trim().length >= 1;
      case 1:
        return (
          formData.birthMonth !== "" &&
          formData.birthDay !== "" &&
          formData.birthYear !== "" &&
          age !== null &&
          age >= 18
        );
      case 2:
        return formData.gender !== "";
      case 3:
        return formData.photos.length >= MIN_PHOTOS;
      case 4:
        return (
          formData.interests.length >= MIN_INTERESTS &&
          formData.interests.length <= MAX_INTERESTS
        );
      case 5:
        return true; // optional
      case 6:
        return true; // optional
      case 7:
        return true; // optional
      default:
        return false;
    }
  }, [currentStep, formData, age]);

  // ── Form data updater ───────────────────────────────────
  const updateForm = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ── Navigation ──────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!canAdvance) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      // Finish onboarding
      console.log("Onboarding complete!", formData);
      router.replace("/(main)/(tabs)/discover");
    }
  }, [canAdvance, currentStep, formData, router]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // ── Interest toggling ───────────────────────────────────
  const toggleInterest = useCallback(
    (interest: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFormData((prev) => {
        const has = prev.interests.includes(interest);
        if (has) {
          return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
        }
        if (prev.interests.length >= MAX_INTERESTS) return prev;
        return { ...prev, interests: [...prev.interests, interest] };
      });
    },
    [],
  );

  // ── Photo handling ──────────────────────────────────────
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
      // Fallback for simulators / mock mode: add a DiceBear avatar
      const seed = `user_${Date.now()}`;
      const mockUri = `https://api.dicebear.com/8.x/avataaars/png?seed=${seed}`;
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

  // ── Location permission ─────────────────────────────────
  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      Haptics.notificationAsync(
        granted
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
      updateForm("locationGranted", granted);
    } catch {
      updateForm("locationGranted", false);
    }
  }, [updateForm]);

  // ── Notification permission ─────────────────────────────
  const requestNotifications = useCallback(async () => {
    // Mock — expo-notifications not available in Expo Go.
    // Replace with real permission request when using a dev build.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateForm("notificationsGranted", true);
  }, [updateForm]);

  // ── Transition animations ───────────────────────────────
  const entering = direction > 0 ? FadeInRight.duration(350) : FadeInLeft.duration(350);
  const exiting = direction > 0 ? FadeOutLeft.duration(250) : FadeOutRight.duration(250);

  // ── Step renderers ──────────────────────────────────────

  function renderStepFirstName() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>What's your first name?</Text>
        <Text style={styles.stepSubtext}>
          This is how people will greet you in person.
        </Text>

        <TextInput
          style={[
            styles.textInput,
            formData.firstName
              ? { borderColor: COLORS.secondary }
              : { borderColor: "#E2E8F0" },
          ]}
          value={formData.firstName}
          onChangeText={(text) => updateForm("firstName", text.slice(0, 30))}
          placeholder="Your first name"
          placeholderTextColor="#CBD5E0"
          autoFocus
          maxLength={30}
          returnKeyType="done"
          selectionColor={COLORS.secondary}
        />

        <Text style={styles.charCounter}>
          {formData.firstName.length}/30
        </Text>
      </View>
    );
  }

  function renderStepBirthday() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>When's your birthday?</Text>
        <Text style={styles.stepSubtext}>
          You must be 18+ to join. We never show your birth year.
        </Text>

        <View style={styles.birthdayRow}>
          {/* Month */}
          <View style={styles.birthdayField}>
            <Text style={styles.fieldLabel}>Month</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.birthdayInput,
                formData.birthMonth
                  ? { borderColor: COLORS.secondary }
                  : { borderColor: "#E2E8F0" },
              ]}
              value={formData.birthMonth}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, "").slice(0, 2);
                updateForm("birthMonth", digits);
              }}
              placeholder="MM"
              placeholderTextColor="#CBD5E0"
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              selectionColor={COLORS.secondary}
            />
          </View>

          {/* Day */}
          <View style={styles.birthdayField}>
            <Text style={styles.fieldLabel}>Day</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.birthdayInput,
                formData.birthDay
                  ? { borderColor: COLORS.secondary }
                  : { borderColor: "#E2E8F0" },
              ]}
              value={formData.birthDay}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, "").slice(0, 2);
                updateForm("birthDay", digits);
              }}
              placeholder="DD"
              placeholderTextColor="#CBD5E0"
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              selectionColor={COLORS.secondary}
            />
          </View>

          {/* Year */}
          <View style={[styles.birthdayField, { flex: 1.4 }]}>
            <Text style={styles.fieldLabel}>Year</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.birthdayInput,
                formData.birthYear
                  ? { borderColor: COLORS.secondary }
                  : { borderColor: "#E2E8F0" },
              ]}
              value={formData.birthYear}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, "").slice(0, 4);
                updateForm("birthYear", digits);
              }}
              placeholder="YYYY"
              placeholderTextColor="#CBD5E0"
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
              selectionColor={COLORS.secondary}
            />
          </View>
        </View>

        {/* Age badge */}
        {age !== null && age >= 18 && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.ageBadge}
          >
            <Calendar size={16} color={COLORS.secondary} strokeWidth={2} />
            <Text style={styles.ageBadgeText}>You're {age}!</Text>
          </Animated.View>
        )}

        {age !== null && age < 18 && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.ageBadge, { backgroundColor: "#FFF5F5" }]}
          >
            <Text style={[styles.ageBadgeText, { color: COLORS.danger }]}>
              You must be 18 or older to use Vita
            </Text>
          </Animated.View>
        )}
      </View>
    );
  }

  function renderStepGender() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>How do you identify?</Text>
        <Text style={styles.stepSubtext}>
          Helps us connect you with the right people.
        </Text>

        <View style={styles.genderOptions}>
          {GENDER_OPTIONS.map((option) => {
            const isSelected = formData.gender === option;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateForm("gender", option);
                }}
                style={[
                  styles.genderButton,
                  isSelected
                    ? styles.genderButtonSelected
                    : styles.genderButtonDefault,
                ]}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    isSelected
                      ? styles.genderButtonTextSelected
                      : styles.genderButtonTextDefault,
                  ]}
                >
                  {option}
                </Text>
                {isSelected && (
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderStepPhotos() {
    // Build a 6-slot array
    const slots: (string | null)[] = [];
    for (let i = 0; i < MAX_PHOTOS; i++) {
      slots.push(formData.photos[i] ?? null);
    }

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>Show your real self</Text>
        <Text style={styles.stepSubtext}>
          Photos of you doing what you love work best. At least 1 required.
        </Text>

        {/* 3x2 grid */}
        <View style={styles.photoGrid}>
          {slots.map((uri, index) => (
            <Pressable
              key={index}
              onPress={() => {
                if (uri) {
                  removePhoto(index);
                } else {
                  addPhoto();
                }
              }}
              style={[
                styles.photoSlot,
                uri ? styles.photoSlotFilled : styles.photoSlotEmpty,
              ]}
            >
              {uri ? (
                <>
                  <Image source={{ uri }} style={styles.photoImage} />
                  {/* Remove button */}
                  <View style={styles.photoRemoveButton}>
                    <X size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </>
              ) : (
                <View style={styles.photoSlotInner}>
                  <Plus size={24} color="#A0AEC0" strokeWidth={1.5} />
                  {index === 0 && (
                    <Text style={styles.photoMainLabel}>Main</Text>
                  )}
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Counter */}
        <Text
          style={[
            styles.photoCounter,
            formData.photos.length >= MIN_PHOTOS && { color: COLORS.success },
          ]}
        >
          {formData.photos.length}/{MAX_PHOTOS} photos
        </Text>
      </View>
    );
  }

  function renderStepInterests() {
    const count = formData.interests.length;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>What are you into?</Text>
        <Text style={styles.stepSubtext}>
          These help us find your people. Pick 3-10.
        </Text>

        {/* Progress text */}
        <Text
          style={[
            styles.interestProgress,
            count >= MIN_INTERESTS && { color: COLORS.success },
          ]}
        >
          {count}/{MAX_INTERESTS} selected
        </Text>

        <ScrollView
          style={styles.interestScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.interestScrollContent}
        >
          {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
            <View key={category} style={styles.interestCategory}>
              <Text style={styles.interestCategoryLabel}>{category}</Text>
              <View style={styles.interestChips}>
                {interests.map((interest) => {
                  const isSelected = formData.interests.includes(interest);
                  const isDisabled = !isSelected && count >= MAX_INTERESTS;

                  return (
                    <Pressable
                      key={interest}
                      onPress={() => !isDisabled && toggleInterest(interest)}
                      disabled={isDisabled}
                      style={[
                        styles.interestChip,
                        isSelected
                          ? styles.interestChipSelected
                          : styles.interestChipDefault,
                        isDisabled && styles.interestChipDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.interestChipText,
                          isSelected
                            ? styles.interestChipTextSelected
                            : styles.interestChipTextDefault,
                        ]}
                      >
                        {interest}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  function renderStepLocation() {
    return (
      <View style={[styles.stepContent, styles.centeredStep]}>
        {/* Icon */}
        <View style={styles.permissionIconWrap}>
          <MapPin size={48} color={COLORS.primary} strokeWidth={1.5} />
        </View>

        <Text style={styles.stepHeading}>Find your scene</Text>
        <Text style={[styles.stepSubtext, { textAlign: "center" }]}>
          Location helps us show events and people near you
        </Text>

        {/* Permission button */}
        <Pressable
          onPress={requestLocation}
          style={({ pressed }) => [
            styles.permissionButton,
            formData.locationGranted === true && styles.permissionButtonGranted,
            pressed && { opacity: 0.9 },
          ]}
        >
          {formData.locationGranted === true ? (
            <View style={styles.permissionButtonRow}>
              <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.permissionButtonText}>Location enabled</Text>
            </View>
          ) : formData.locationGranted === false ? (
            <Text style={styles.permissionButtonText}>Permission denied</Text>
          ) : (
            <View style={styles.permissionButtonRow}>
              <MapPin size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.permissionButtonText}>Allow Location</Text>
            </View>
          )}
        </Pressable>

        {/* Skip option */}
        <Pressable onPress={goNext} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Maybe later</Text>
        </Pressable>
      </View>
    );
  }

  function renderStepBio() {
    const charCount = formData.bio.length;
    const isNearLimit = charCount >= 160;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>Almost there</Text>
        <Text style={styles.stepSubtext}>
          Your community awaits. What's your ideal weekend plan? Your go-to hangout spot?
        </Text>

        <TextInput
          style={[
            styles.textInput,
            styles.bioInput,
            formData.bio
              ? { borderColor: COLORS.secondary }
              : { borderColor: "#E2E8F0" },
          ]}
          value={formData.bio}
          onChangeText={(text) => {
            if (text.length <= MAX_BIO) {
              updateForm("bio", text);
            }
          }}
          placeholder="Saturday mornings at the farmers market, evenings at live jazz..."
          placeholderTextColor="#CBD5E0"
          multiline
          maxLength={MAX_BIO}
          textAlignVertical="top"
          selectionColor={COLORS.secondary}
        />

        {/* Character counter */}
        <Text
          style={[
            styles.charCounter,
            isNearLimit && charCount < MAX_BIO
              ? { color: COLORS.warning }
              : charCount >= MAX_BIO
                ? { color: COLORS.danger }
                : undefined,
          ]}
        >
          {charCount}/{MAX_BIO}
        </Text>
      </View>
    );
  }

  function renderStepNotifications() {
    return (
      <View style={[styles.stepContent, styles.centeredStep]}>
        {/* Icon */}
        <View style={styles.permissionIconWrap}>
          <Bell size={48} color={COLORS.primary} strokeWidth={1.5} />
        </View>

        <Text style={styles.stepHeading}>Stay in the loop</Text>
        <Text style={[styles.stepSubtext, { textAlign: "center" }]}>
          We'll ping you for matches, messages, and events worth showing up to
        </Text>

        {/* Permission button */}
        <Pressable
          onPress={requestNotifications}
          style={({ pressed }) => [
            styles.permissionButton,
            formData.notificationsGranted === true &&
              styles.permissionButtonGranted,
            pressed && { opacity: 0.9 },
          ]}
        >
          {formData.notificationsGranted === true ? (
            <View style={styles.permissionButtonRow}>
              <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.permissionButtonText}>
                Notifications enabled
              </Text>
            </View>
          ) : formData.notificationsGranted === false ? (
            <Text style={styles.permissionButtonText}>Permission denied</Text>
          ) : (
            <View style={styles.permissionButtonRow}>
              <Bell size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.permissionButtonText}>
                Enable Notifications
              </Text>
            </View>
          )}
        </Pressable>

        {/* Skip option */}
        <Pressable onPress={goNext} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Maybe later</Text>
        </Pressable>

        {/* Get started button (replaces Continue for last step) */}
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            console.log("Onboarding complete!", formData);
            router.replace("/(main)/(tabs)/discover");
          }}
          style={({ pressed }) => [
            styles.getStartedButton,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.getStartedButtonText}>Find your scene</Text>
          <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>
    );
  }

  // ── Step renderer dispatch ──────────────────────────────
  function renderCurrentStep() {
    switch (currentStep) {
      case 0:
        return renderStepFirstName();
      case 1:
        return renderStepBirthday();
      case 2:
        return renderStepGender();
      case 3:
        return renderStepPhotos();
      case 4:
        return renderStepInterests();
      case 5:
        return renderStepLocation();
      case 6:
        return renderStepBio();
      case 7:
        return renderStepNotifications();
      default:
        return null;
    }
  }

  // Steps with their own navigation (skip + action buttons)
  const stepHasOwnNav = currentStep === 5 || currentStep === 7;

  // ── Main Render ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* ── Header: Progress + Step Icons ── */}
        <View style={styles.header}>
          {/* Back button + step counter */}
          <View style={styles.headerTop}>
            {currentStep > 0 ? (
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

            <Text style={styles.stepCounter}>
              {currentStep + 1} of {TOTAL_STEPS}
            </Text>
          </View>

          {/* Progress bar segments */}
          <View style={styles.progressBar}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor:
                      i <= currentStep ? COLORS.primary : "#E2E8F0",
                  },
                ]}
              />
            ))}
          </View>

          {/* Step icons row */}
          <View style={styles.stepIconsRow}>
            {STEP_ICONS.map((IconComp, i) => {
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <View key={i} style={styles.stepIconItem}>
                  <IconComp
                    size={14}
                    color={
                      isActive
                        ? COLORS.primary
                        : isDone
                          ? COLORS.secondary
                          : "#CBD5E0"
                    }
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Step Content (animated) ── */}
        <View style={styles.stepWrapper}>
          <Animated.View
            key={currentStep}
            entering={entering}
            exiting={exiting}
            style={styles.flex}
          >
            {renderCurrentStep()}
          </Animated.View>
        </View>

        {/* ── Bottom: Continue / Finish button ── */}
        {!stepHasOwnNav && (
          <View style={styles.bottomBar}>
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
                {currentStep === TOTAL_STEPS - 1 ? "Finish" : "Continue"}
              </Text>
              <ChevronRight
                size={18}
                color={canAdvance ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
                strokeWidth={2.5}
              />
            </Pressable>
          </View>
        )}
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

  // ── Header ──
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
  stepCounter: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#A0AEC0",
  },

  // ── Progress bar ──
  progressBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },

  // ── Step icons row ──
  stepIconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  stepIconItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
  },

  // ── Step wrapper ──
  stepWrapper: {
    flex: 1,
    overflow: "hidden",
  },

  // ── Step content ──
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  centeredStep: {
    alignItems: "center",
    paddingTop: 40,
  },
  stepHeading: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepSubtext: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#A0AEC0",
    lineHeight: 22,
    marginBottom: 28,
  },

  // ── Text input ──
  textInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: COLORS.primary,
  },
  charCounter: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#CBD5E0",
    textAlign: "right",
    marginTop: 8,
  },

  // ── Birthday ──
  birthdayRow: {
    flexDirection: "row",
    gap: 12,
  },
  birthdayField: {
    flex: 1,
  },
  birthdayInput: {
    paddingHorizontal: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#A0AEC0",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  ageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#EBF8FF",
  },
  ageBadgeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.primary,
  },

  // ── Gender ──
  genderOptions: {
    gap: 12,
  },
  genderButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  genderButtonDefault: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F7FAFC",
  },
  genderButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  genderButtonTextDefault: {
    color: COLORS.primary,
  },
  genderButtonTextSelected: {
    color: "#FFFFFF",
  },

  // ── Photos ──
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoSlot: {
    width: "30.5%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  photoSlotEmpty: {
    backgroundColor: "#F7FAFC",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  photoSlotFilled: {
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  photoSlotInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoMainLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#A0AEC0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  photoRemoveButton: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  photoCounter: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#A0AEC0",
    textAlign: "center",
    marginTop: 16,
  },

  // ── Interests ──
  interestProgress: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#A0AEC0",
    marginBottom: 16,
  },
  interestScroll: {
    flex: 1,
  },
  interestScrollContent: {
    paddingBottom: 24,
    gap: 20,
  },
  interestCategory: {
    gap: 8,
  },
  interestCategoryLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#A0AEC0",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  interestChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  interestChipDefault: {
    backgroundColor: "#F7FAFC",
    borderColor: "#E2E8F0",
  },
  interestChipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  interestChipDisabled: {
    opacity: 0.4,
  },
  interestChipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  interestChipTextDefault: {
    color: "#2D3748",
  },
  interestChipTextSelected: {
    color: "#FFFFFF",
  },

  // ── Permission steps (Location + Notifications) ──
  permissionIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#EBF8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  permissionButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  permissionButtonGranted: {
    backgroundColor: COLORS.success,
  },
  permissionButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#A0AEC0",
  },
  getStartedButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },

  // ── Bio ──
  bioInput: {
    height: 140,
    paddingTop: 14,
    paddingBottom: 14,
  },

  // ── Bottom bar ──
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
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  continueButtonTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
});
