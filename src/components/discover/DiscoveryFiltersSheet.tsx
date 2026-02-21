import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Modal as RNModal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { X, Minus, Plus } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GenderOption = "Everyone" | "Men" | "Women" | "Non-binary";

export interface DiscoveryFilters {
  distanceMiles: number;
  ageMin: number;
  ageMax: number;
  genders: GenderOption[];
  interests: string[];
  verifiedOnly: boolean;
}

export interface DiscoveryFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply?: (filters: DiscoveryFilters) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENDER_OPTIONS: GenderOption[] = ["Everyone", "Men", "Women", "Non-binary"];

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

const DEFAULT_FILTERS: DiscoveryFilters = {
  distanceMiles: 25,
  ageMin: 18,
  ageMax: 45,
  genders: ["Everyone"],
  interests: [],
  verifiedOnly: false,
};

const DISTANCE_MIN = 1;
const DISTANCE_MAX = 100;
const AGE_MIN = 18;
const AGE_MAX = 65;

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

// ---------------------------------------------------------------------------
// Stepper Row
// ---------------------------------------------------------------------------

function StepperRow({
  label,
  value,
  suffix,
  onDecrement,
  onIncrement,
  disableDecrement,
  disableIncrement,
}: {
  label: string;
  value: string;
  suffix?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  disableDecrement?: boolean;
  disableIncrement?: boolean;
}) {
  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperControls}>
        <Pressable
          onPress={onDecrement}
          disabled={disableDecrement}
          style={[
            s.stepperBtn,
            disableDecrement && s.stepperBtnDisabled,
          ]}
          hitSlop={4}
        >
          <Minus
            size={16}
            color={disableDecrement ? "#CBD5E0" : COLORS.primary}
          />
        </Pressable>
        <View style={s.stepperValuePill}>
          <Text style={s.stepperValueText}>
            {value}{suffix ? ` ${suffix}` : ""}
          </Text>
        </View>
        <Pressable
          onPress={onIncrement}
          disabled={disableIncrement}
          style={[
            s.stepperBtn,
            disableIncrement && s.stepperBtnDisabled,
          ]}
          hitSlop={4}
        >
          <Plus
            size={16}
            color={disableIncrement ? "#CBD5E0" : COLORS.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DiscoveryFiltersSheet({
  visible,
  onClose,
  onApply,
}: DiscoveryFiltersSheetProps) {
  const insets = useSafeAreaInsets();

  const [distance, setDistance] = useState(DEFAULT_FILTERS.distanceMiles);
  const [ageMin, setAgeMin] = useState(DEFAULT_FILTERS.ageMin);
  const [ageMax, setAgeMax] = useState(DEFAULT_FILTERS.ageMax);
  const [selectedGenders, setSelectedGenders] = useState<GenderOption[]>(
    [...DEFAULT_FILTERS.genders],
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    [...DEFAULT_FILTERS.interests],
  );
  const [verifiedOnly, setVerifiedOnly] = useState(DEFAULT_FILTERS.verifiedOnly);

  // --- Distance handlers ---
  const decrementDistance = useCallback(() => {
    setDistance((v) => {
      const step = v > 10 ? 5 : 1;
      return Math.max(DISTANCE_MIN, v - step);
    });
  }, []);

  const incrementDistance = useCallback(() => {
    setDistance((v) => {
      const step = v >= 10 ? 5 : 1;
      return Math.min(DISTANCE_MAX, v + step);
    });
  }, []);

  // --- Age min handlers ---
  const decrementAgeMin = useCallback(() => {
    setAgeMin((v) => Math.max(AGE_MIN, v - 1));
  }, []);

  const incrementAgeMin = useCallback(() => {
    setAgeMin((v) => {
      const next = Math.min(ageMax, v + 1);
      return next;
    });
  }, [ageMax]);

  // --- Age max handlers ---
  const decrementAgeMax = useCallback(() => {
    setAgeMax((v) => {
      const next = Math.max(ageMin, v - 1);
      return next;
    });
  }, [ageMin]);

  const incrementAgeMax = useCallback(() => {
    setAgeMax((v) => Math.min(AGE_MAX, v + 1));
  }, []);

  // --- Gender toggle (multi-select) ---
  const toggleGender = useCallback((gender: GenderOption) => {
    setSelectedGenders((prev) => {
      if (gender === "Everyone") {
        // If "Everyone" is selected, toggle it exclusively
        return prev.includes("Everyone") ? [] : ["Everyone"];
      }
      // Remove "Everyone" when selecting a specific gender
      const withoutEveryone = prev.filter((g) => g !== "Everyone");
      if (withoutEveryone.includes(gender)) {
        return withoutEveryone.filter((g) => g !== gender);
      }
      return [...withoutEveryone, gender];
    });
  }, []);

  // --- Interest toggle ---
  const toggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      return [...prev, interest];
    });
  }, []);

  // --- Reset ---
  const handleReset = useCallback(() => {
    setDistance(DEFAULT_FILTERS.distanceMiles);
    setAgeMin(DEFAULT_FILTERS.ageMin);
    setAgeMax(DEFAULT_FILTERS.ageMax);
    setSelectedGenders([...DEFAULT_FILTERS.genders]);
    setSelectedInterests([...DEFAULT_FILTERS.interests]);
    setVerifiedOnly(DEFAULT_FILTERS.verifiedOnly);
  }, []);

  // --- Apply ---
  const handleApply = useCallback(() => {
    const filters: DiscoveryFilters = {
      distanceMiles: distance,
      ageMin,
      ageMax,
      genders: selectedGenders,
      interests: selectedInterests,
      verifiedOnly,
    };
    onApply?.(filters);
    onClose();
  }, [distance, ageMin, ageMax, selectedGenders, selectedInterests, verifiedOnly, onApply, onClose]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.modalRoot}>
        {/* Backdrop */}
        <Pressable style={s.backdrop} onPress={onClose}>
          <Animated.View
            entering={FadeIn.duration(250)}
            style={s.backdropFill}
          />
        </Pressable>

        {/* Panel */}
        <Animated.View
          entering={SlideInDown.duration(300)}
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
            <Text style={s.headerTitle}>Discovery Filters</Text>
            <Pressable
              onPress={onClose}
              style={s.closeBtn}
              hitSlop={8}
            >
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={s.scrollView}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Distance Range */}
            <SectionHeader title="DISTANCE RANGE" />
            <View style={s.sectionGroup}>
              <StepperRow
                label="Distance"
                value={String(distance)}
                suffix="mi"
                onDecrement={decrementDistance}
                onIncrement={incrementDistance}
                disableDecrement={distance <= DISTANCE_MIN}
                disableIncrement={distance >= DISTANCE_MAX}
              />
            </View>

            {/* Age Range */}
            <SectionHeader title="AGE RANGE" />
            <View style={s.sectionGroup}>
              <StepperRow
                label="Minimum"
                value={String(ageMin)}
                onDecrement={decrementAgeMin}
                onIncrement={incrementAgeMin}
                disableDecrement={ageMin <= AGE_MIN}
                disableIncrement={ageMin >= ageMax}
              />
              <View style={s.itemDivider} />
              <StepperRow
                label="Maximum"
                value={String(ageMax)}
                onDecrement={decrementAgeMax}
                onIncrement={incrementAgeMax}
                disableDecrement={ageMax <= ageMin}
                disableIncrement={ageMax >= AGE_MAX}
              />
            </View>

            {/* Gender */}
            <SectionHeader title="GENDER" />
            <View style={s.chipRow}>
              {GENDER_OPTIONS.map((gender) => {
                const selected = selectedGenders.includes(gender);
                return (
                  <Pressable
                    key={gender}
                    onPress={() => toggleGender(gender)}
                    style={[
                      s.chip,
                      selected ? s.chipSelected : s.chipUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        selected ? s.chipTextSelected : s.chipTextUnselected,
                      ]}
                    >
                      {gender}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Interests */}
            <SectionHeader title="INTERESTS" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.interestsRow}
              style={s.interestsScroll}
            >
              {ALL_INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[
                      s.chip,
                      selected ? s.chipSelected : s.chipUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        selected ? s.chipTextSelected : s.chipTextUnselected,
                      ]}
                    >
                      {interest}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Verification */}
            <SectionHeader title="VERIFICATION" />
            <View style={s.sectionGroup}>
              <View style={s.toggleItem}>
                <Text style={s.toggleLabel}>Verified only</Text>
                <Switch
                  value={verifiedOnly}
                  onValueChange={setVerifiedOnly}
                  trackColor={{ false: "#E2E8F0", true: COLORS.secondary }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E2E8F0"
                />
              </View>
            </View>
          </ScrollView>

          {/* Bottom bar */}
          <View style={s.bottomBar}>
            <View style={{ flex: 1 }}>
              <Button variant="ghost" fullWidth onPress={handleReset}>
                Reset
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button fullWidth onPress={handleApply}>
                Apply Filters
              </Button>
            </View>
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}

DiscoveryFiltersSheet.displayName = "DiscoveryFiltersSheet";

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

  // Header
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

  // Scrollable content
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  // Section header (uppercase)
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A0AEC0",
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: "Inter_700Bold",
  },

  // Section group
  sectionGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 0,
  },

  // Stepper row
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    minHeight: 48,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperValuePill: {
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },

  // Chips (gender & interests)
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestsScroll: {
    marginBottom: 0,
  },
  interestsRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipUnselected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  chipTextUnselected: {
    color: "#374151",
  },

  // Toggle item
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
});
