import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
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
import { X, ShieldCheck } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_DETAILS_LENGTH = 500;

const REPORT_REASONS = [
  "Harassment or bullying",
  "Spam or scam",
  "Fake profile",
  "Inappropriate content",
  "Makes me uncomfortable",
  "Other",
] as const;

type ReportReason = (typeof REPORT_REASONS)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userId: string;
}

// ---------------------------------------------------------------------------
// Radio Option Row
// ---------------------------------------------------------------------------

function ReasonRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.reasonRow,
        selected && s.reasonRowSelected,
      ]}
      accessible={true}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {/* Radio circle */}
      <View
        style={[
          s.radioOuter,
          selected && s.radioOuterSelected,
        ]}
      >
        {selected && <View style={s.radioInner} />}
      </View>
      <Text style={s.reasonText}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReportSheet({
  visible,
  onClose,
  userName,
  userId,
}: ReportSheetProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");

  const handleClose = useCallback(() => {
    // Reset state when closing
    setStep(1);
    setSelectedReason(null);
    setDetails("");
    onClose();
  }, [onClose]);

  const handleContinue = useCallback(() => {
    if (step === 1 && selectedReason) {
      setStep(2);
    }
  }, [step, selectedReason]);

  const handleSubmit = useCallback(() => {
    // In a real app, send report to backend
    setStep(3);
  }, []);

  const handleSkip = useCallback(() => {
    // Skip details and submit directly
    setStep(3);
  }, []);

  const handleDetailsChange = useCallback((text: string) => {
    if (text.length <= MAX_DETAILS_LENGTH) {
      setDetails(text);
    }
  }, []);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.modalRoot}
      >
        {/* Backdrop */}
        <Pressable style={s.backdrop} onPress={handleClose}>
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
            <View style={s.headerLeft}>
              <Text style={s.headerTitle}>Report {userName}</Text>
              <Text style={s.stepIndicator}>Step {step} of 3</Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={s.closeBtn}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Step 1: Reason Selection */}
          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>What's the issue?</Text>
              <View style={s.reasonList}>
                {REPORT_REASONS.map((reason) => (
                  <ReasonRow
                    key={reason}
                    label={reason}
                    selected={selectedReason === reason}
                    onPress={() => setSelectedReason(reason)}
                  />
                ))}
              </View>
              <View style={s.bottomAction}>
                <Button
                  fullWidth
                  disabled={!selectedReason}
                  onPress={handleContinue}
                >
                  Continue
                </Button>
              </View>
            </View>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Tell us more</Text>
              <Text style={s.optionalLabel}>(optional)</Text>
              <View style={s.detailsInputWrapper}>
                <TextInput
                  value={details}
                  onChangeText={handleDetailsChange}
                  placeholder="Add any additional details..."
                  placeholderTextColor="#A0AEC0"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={MAX_DETAILS_LENGTH}
                  style={s.detailsInput}
                />
                <Text
                  style={[
                    s.charCounter,
                    details.length > MAX_DETAILS_LENGTH * 0.9 && {
                      color: COLORS.danger,
                    },
                  ]}
                >
                  {details.length}/{MAX_DETAILS_LENGTH}
                </Text>
              </View>
              <View style={s.bottomActionRow}>
                <View style={{ flex: 1 }}>
                  <Button variant="ghost" fullWidth onPress={handleSkip}>
                    Skip
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button fullWidth onPress={handleSubmit}>
                    Submit
                  </Button>
                </View>
              </View>
            </View>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <View style={s.stepContent}>
              <View style={s.successContainer}>
                <View style={s.successIconCircle}>
                  <ShieldCheck size={32} color={COLORS.success} />
                </View>
                <Text style={s.successTitle}>Report submitted</Text>
                <Text style={s.successDescription}>
                  Thank you for helping keep Vita safe. Our team will review
                  this report within 24 hours.
                </Text>
              </View>
              <View style={s.bottomAction}>
                <Button fullWidth onPress={handleClose}>
                  Done
                </Button>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

ReportSheet.displayName = "ReportSheet";

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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  stepIndicator: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  // Step content
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  optionalLabel: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: -8,
    marginBottom: 12,
  },

  // Reason list
  reasonList: {
    marginBottom: 16,
  },
  reasonRow: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  reasonRowSelected: {
    backgroundColor: "rgba(26,54,93,0.06)",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },

  // Details input
  detailsInputWrapper: {
    marginBottom: 16,
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  charCounter: {
    position: "absolute",
    bottom: 10,
    right: 12,
    fontSize: 11,
    color: "#A0AEC0",
    fontVariant: ["tabular-nums"],
  },

  // Bottom actions
  bottomAction: {
    marginTop: 8,
    marginBottom: 8,
  },
  bottomActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },

  // Success state
  successContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(56,161,105,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});
