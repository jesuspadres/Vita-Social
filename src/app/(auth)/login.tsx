import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Eye, MapPin, Users } from "lucide-react-native";
import { APP_TAGLINE, COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Value proposition data
// ---------------------------------------------------------------------------

const VALUE_PROPS = [
  { Icon: Eye, text: "See who likes you \u2014 no paywall" },
  { Icon: MapPin, text: "GPS-verified real-world meetups" },
  { Icon: Users, text: "45-day active communities" },
] as const;

// ---------------------------------------------------------------------------
// Phone formatting helper
// ---------------------------------------------------------------------------

function formatPhone(digits: string): string {
  let formatted = "";
  if (digits.length > 0) formatted += `(${digits.slice(0, 3)}`;
  if (digits.length > 3) formatted += `) ${digits.slice(3, 6)}`;
  if (digits.length > 6) formatted += `-${digits.slice(6)}`;
  return formatted;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LoginScreen() {
  const router = useRouter();
  const [rawDigits, setRawDigits] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidPhone = rawDigits.length >= 10;
  const displayPhone = rawDigits.length > 0 ? formatPhone(rawDigits) : "";

  // ── Phone change handler ────────────────────────────────
  const handlePhoneChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    setRawDigits(digits);
  }, []);

  // ── Continue handler ────────────────────────────────────
  const handleContinue = useCallback(async () => {
    if (!isValidPhone || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    const formattedFull = `+1 ${formatPhone(rawDigits)}`;
    await SecureStore.setItemAsync("vita_phone", formattedFull);

    // Small delay for UX feel
    await new Promise((r) => setTimeout(r, 300));

    router.push("/verify");
    setIsLoading(false);
  }, [isValidPhone, isLoading, rawDigits, router]);

  // ── Dev skip handler ────────────────────────────────────
  const handleDevSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(main)/(tabs)/discover");
  }, [router]);

  // ── Render ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen gradient */}
      <LinearGradient
        colors={["#1A365D", "#2A6B7C", "#4A90A4"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative orbs */}
      <View style={[styles.orb, styles.orbTopRight]} />
      <View style={[styles.orb, styles.orbBottomLeft]} />
      <View style={[styles.orb, styles.orbCenterRight]} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* ── Top section: Brand + Value Props ── */}
          <View style={styles.topSection}>
            {/* Vita title */}
            <Animated.View entering={FadeInDown.duration(600).delay(100)}>
              <Text style={styles.title}>Vita</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
              <Text style={styles.tagline}>{APP_TAGLINE}</Text>
            </Animated.View>

            {/* Value propositions */}
            <Animated.View
              entering={FadeInDown.duration(600).delay(350)}
              style={styles.valuePropsCard}
            >
              {VALUE_PROPS.map((prop, index) => (
                <Animated.View
                  key={prop.text}
                  entering={FadeInDown.duration(500).delay(450 + index * 100)}
                  style={styles.valuePropRow}
                >
                  <View style={styles.valuePropIconWrap}>
                    <prop.Icon
                      size={20}
                      color="rgba(255,255,255,0.8)"
                      strokeWidth={1.75}
                    />
                  </View>
                  <Text style={styles.valuePropText}>{prop.text}</Text>
                </Animated.View>
              ))}
            </Animated.View>
          </View>

          {/* ── Bottom section: Phone Input + Actions ── */}
          <View style={styles.bottomSection}>
            {/* Phone input */}
            <Animated.View entering={FadeInDown.duration(600).delay(600)}>
              <Text style={styles.inputLabel}>Enter your phone number</Text>

              <View style={styles.phoneRow}>
                {/* Country code badge */}
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+1</Text>
                </View>

                {/* Phone TextInput */}
                <TextInput
                  style={styles.phoneInput}
                  value={displayPhone}
                  onChangeText={handlePhoneChange}
                  placeholder="(555) 000-0000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  maxLength={14} // formatted length: (555) 000-0000
                  returnKeyType="done"
                  selectionColor="rgba(255,255,255,0.5)"
                />
              </View>
            </Animated.View>

            {/* Continue button */}
            <Animated.View entering={FadeInDown.duration(600).delay(700)}>
              <Pressable
                onPress={handleContinue}
                disabled={!isValidPhone || isLoading}
                style={({ pressed }) => [
                  styles.continueButton,
                  (!isValidPhone || isLoading) && styles.continueButtonDisabled,
                  pressed && isValidPhone && styles.continueButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    (!isValidPhone || isLoading) &&
                      styles.continueButtonTextDisabled,
                  ]}
                >
                  {isLoading ? "Sending code..." : "Continue"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Dev mode skip */}
            <Animated.View entering={FadeInDown.duration(600).delay(800)}>
              <Pressable onPress={handleDevSkip} style={styles.devSkipButton}>
                <Text style={styles.devSkipText}>Skip to app (dev mode)</Text>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },

  // ── Decorative orbs ──
  orb: {
    position: "absolute",
    borderRadius: 9999,
  },
  orbTopRight: {
    width: 280,
    height: 280,
    top: -60,
    right: -80,
    backgroundColor: COLORS.secondary,
    opacity: 0.15,
  },
  orbBottomLeft: {
    width: 240,
    height: 240,
    bottom: 60,
    left: -100,
    backgroundColor: COLORS.success,
    opacity: 0.18,
  },
  orbCenterRight: {
    width: 200,
    height: 200,
    top: "45%",
    right: -50,
    backgroundColor: COLORS.warning,
    opacity: 0.15,
  },

  // ── Top section ──
  topSection: {
    alignItems: "center",
  },
  title: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -1,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 40,
    letterSpacing: 0.5,
  },

  // ── Value proposition card ──
  valuePropsCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  valuePropRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valuePropIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  valuePropText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },

  // ── Bottom section ──
  bottomSection: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countryCodeBadge: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  phoneInput: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },

  // ── Continue button ──
  continueButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: COLORS.primary,
  },
  continueButtonTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },

  // ── Dev skip ──
  devSkipButton: {
    alignItems: "center",
    paddingVertical: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  devSkipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
  },
});
