import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import {
  ArrowLeft,
  Lock,
  Check,
  X,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChangePasswordPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Password Requirements
// ---------------------------------------------------------------------------

interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RequirementRow({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={s.requirementRow}>
      {met ? (
        <Check size={14} color={COLORS.success} strokeWidth={2.5} />
      ) : (
        <X size={14} color="#CBD5E0" strokeWidth={2.5} />
      )}
      <Text style={[s.requirementText, met && s.requirementTextMet]}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ChangePasswordPage({ onClose }: ChangePasswordPageProps) {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();

  // Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Slide-in animation
  const translateX = useSharedValue(SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezierFn(0.22, 1, 0.36, 1),
    });
  }, [translateX]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleClose = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
    setTimeout(onClose, 260);
  }, [translateX, onClose]);

  // Swipe-right-to-go-back gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (
        event.translationX > SWIPE_THRESHOLD ||
        event.velocityX > VELOCITY_THRESHOLD
      ) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  // Requirement checks
  const requirementResults = useMemo(
    () => REQUIREMENTS.map((req) => req.test(newPassword)),
    [newPassword],
  );
  const allRequirementsMet = requirementResults.every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 && allRequirementsMet && passwordsMatch;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    toast("Password updated successfully!", "success");
    setTimeout(() => {
      handleClose();
    }, 1200);
  }, [canSubmit, toast, handleClose]);

  const handleForgotPassword = useCallback(() => {
    toast("Password reset link sent to your email.", "info");
  }, [toast]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[s.overlay, slideStyle]}>
        <View style={[s.root, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={s.header}>
            <Pressable
              onPress={handleClose}
              style={s.backBtn}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <Text style={s.headerTitle}>Change Password</Text>
            <View style={s.headerSpacer} />
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 40 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Form card */}
            <View style={s.sectionGroup}>
              {/* Current Password */}
              <View style={s.inputRow}>
                <Lock size={18} color="#718096" strokeWidth={1.75} />
                <TextInput
                  style={s.textInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current Password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={s.itemDivider} />

              {/* New Password */}
              <View style={s.inputRow}>
                <Lock size={18} color="#718096" strokeWidth={1.75} />
                <TextInput
                  style={s.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New Password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={s.itemDivider} />

              {/* Confirm New Password */}
              <View style={s.inputRow}>
                <Lock size={18} color="#718096" strokeWidth={1.75} />
                <TextInput
                  style={s.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password requirements */}
            <View style={s.requirementsContainer}>
              {REQUIREMENTS.map((req, i) => (
                <RequirementRow
                  key={req.label}
                  label={req.label}
                  met={requirementResults[i]}
                />
              ))}
              {/* Passwords match indicator */}
              {confirmPassword.length > 0 && (
                <RequirementRow
                  label="Passwords match"
                  met={passwordsMatch}
                />
              )}
            </View>

            {/* Update Password button */}
            <View style={s.buttonWrapper}>
              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={!canSubmit}
                onPress={handleSubmit}
                iconLeft={<Lock size={16} color="#FFFFFF" />}
              >
                Update Password
              </Button>
            </View>

            {/* Forgot Password link */}
            <Pressable onPress={handleForgotPassword} style={s.forgotBtn}>
              <Text style={s.forgotText}>Forgot Password?</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

ChangePasswordPage.displayName = "ChangePasswordPage";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  root: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: {
    width: 44,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  // Section group (form card)
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
    marginLeft: 30,
  },

  // Input row
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },

  // Requirements
  requirementsContainer: {
    marginTop: 20,
    paddingHorizontal: 4,
    gap: 10,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  requirementText: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
  requirementTextMet: {
    color: COLORS.success,
  },

  // Button
  buttonWrapper: {
    marginTop: 32,
  },

  // Forgot password
  forgotBtn: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.secondary,
    fontFamily: "Inter_500Medium",
  },
});
