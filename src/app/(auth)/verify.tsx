import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowLeft } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VerifyScreen() {
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [phone, setPhone] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── Retrieve stored phone number ────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync("vita_phone");
        setPhone(stored ?? "+1 (555) 000-0000");
      } catch {
        setPhone("+1 (555) 000-0000");
      }
    })();
  }, []);

  // ── Cooldown timer ──────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ── Auto-focus first input ──────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  // ── Verification handler ────────────────────────────────
  const handleVerify = useCallback(
    async (code: string[]) => {
      const fullCode = code.join("");
      if (fullCode.length !== OTP_LENGTH) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsVerifying(true);

      // Mock verification: any 6-digit code succeeds
      await new Promise((resolve) => setTimeout(resolve, 800));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/onboarding");
      setIsVerifying(false);
    },
    [router],
  );

  // ── Input change handler ────────────────────────────────
  const handleChange = useCallback(
    (index: number, value: string) => {
      // Handle paste: if value has multiple digits, distribute them
      const digits = value.replace(/\D/g, "");

      if (digits.length > 1) {
        // Paste scenario: fill from current index
        const newOtp = [...otp];
        for (let i = 0; i < digits.length && index + i < OTP_LENGTH; i++) {
          newOtp[index + i] = digits[i];
        }
        setOtp(newOtp);

        // Focus the next empty input or the last one
        const nextEmpty = newOtp.findIndex((d) => d === "");
        const focusIdx =
          nextEmpty === -1 ? OTP_LENGTH - 1 : Math.min(nextEmpty, OTP_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
        setFocusedIndex(focusIdx);

        // Auto-submit if all filled
        if (newOtp.every((d) => d !== "")) {
          handleVerify(newOtp);
        }
        return;
      }

      // Single digit
      const digit = digits.slice(-1);
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto-advance to next input
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }

      // Auto-submit when all digits filled
      if (digit && newOtp.every((d) => d !== "")) {
        handleVerify(newOtp);
      }
    },
    [otp, handleVerify],
  );

  // ── Key press handler (backspace) ───────────────────────
  const handleKeyPress = useCallback(
    (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === "Backspace") {
        if (!otp[index] && index > 0) {
          // Move to previous input and clear it
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
          inputRefs.current[index - 1]?.focus();
          setFocusedIndex(index - 1);
        } else {
          // Clear current input
          const newOtp = [...otp];
          newOtp[index] = "";
          setOtp(newOtp);
        }
      }
    },
    [otp],
  );

  // ── Resend handler ──────────────────────────────────────
  const handleResend = useCallback(() => {
    if (cooldown > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCooldown(RESEND_COOLDOWN);
    setOtp(Array(OTP_LENGTH).fill(""));
    setFocusedIndex(0);
    inputRefs.current[0]?.focus();
  }, [cooldown]);

  // ── Render ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Back button */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <ArrowLeft size={22} color={COLORS.primary} strokeWidth={2} />
          </Pressable>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.heading}>Verify your number</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(150)}>
          <Text style={styles.subtext}>
            We sent a 6-digit code to{" "}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>
        </Animated.View>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.duration(400).delay(250 + index * 60)}
            >
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit
                    ? styles.otpInputFilled
                    : focusedIndex === index
                      ? styles.otpInputFocused
                      : styles.otpInputEmpty,
                  isVerifying && styles.otpInputDisabled,
                ]}
                value={digit}
                onChangeText={(text) => handleChange(index, text)}
                onKeyPress={(e) => handleKeyPress(index, e)}
                onFocus={() => setFocusedIndex(index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1} // allow paste on first input
                editable={!isVerifying}
                selectTextOnFocus
                selectionColor={COLORS.secondary}
                textContentType="oneTimeCode"
                autoComplete={index === 0 ? "sms-otp" : "off"}
              />
            </Animated.View>
          ))}
        </View>

        {/* Verifying indicator */}
        {isVerifying && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.verifyingRow}
          >
            <Text style={styles.verifyingText}>Verifying...</Text>
          </Animated.View>
        )}

        {/* Resend code */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(600)}
          style={styles.resendContainer}
        >
          <Text style={styles.resendLabel}>Didn't receive a code? </Text>
          {cooldown > 0 ? (
            <Text style={styles.resendCooldown}>Resend in {cooldown}s</Text>
          ) : (
            <Pressable onPress={handleResend} hitSlop={8} style={styles.resendButton}>
              <Text style={styles.resendActive}>Resend code</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Spacer to push content up with keyboard */}
        <View style={styles.spacer} />
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
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // ── Back button ──
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  // ── Header ──
  heading: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#A0AEC0",
    lineHeight: 22,
    marginBottom: 36,
  },
  phoneHighlight: {
    fontFamily: "Inter_600SemiBold",
    color: "#4A5568",
  },

  // ── OTP inputs ──
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 28,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    textAlign: "center",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: COLORS.primary,
  },
  otpInputEmpty: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F7FAFC",
  },
  otpInputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFFFF",
  },
  otpInputFilled: {
    borderColor: COLORS.secondary,
    backgroundColor: "#FFFFFF",
  },
  otpInputDisabled: {
    opacity: 0.5,
  },

  // ── Verifying ──
  verifyingRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  verifyingText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#A0AEC0",
  },

  // ── Resend ──
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#A0AEC0",
  },
  resendCooldown: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#CBD5E0",
  },
  resendButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  resendActive: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#3A7487",
  },

  // ── Spacer ──
  spacer: {
    flex: 1,
  },
});
