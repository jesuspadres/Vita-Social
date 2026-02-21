import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Globe,
  Users,
  UserCheck,
  CheckCircle,
} from "lucide-react-native";
import type { EventVisibility } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DURATIONS = [
  { label: "1h", value: 1 },
  { label: "1.5h", value: 1.5 },
  { label: "2h", value: 2 },
  { label: "3h", value: 3 },
  { label: "4h", value: 4 },
] as const;

const VISIBILITY_OPTIONS: {
  value: EventVisibility;
  label: string;
  Icon: typeof Globe;
}[] = [
  { value: "public", label: "Public", Icon: Globe },
  { value: "group", label: "Group", Icon: Users },
  { value: "friends", label: "Friends", Icon: UserCheck },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateEventSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateEventSheet({ visible, onClose }: CreateEventSheetProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(2);
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [capacity, setCapacity] = useState("20");
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when sheet opens
  useEffect(() => {
    if (visible) {
      setTitle("");
      setLocation("");
      setDuration(2);
      setVisibility("public");
      setCapacity("20");
      setShowSuccess(false);
    }
  }, [visible]);

  // Validation
  const isValid = useMemo(() => {
    const trimTitle = title.trim();
    const trimLocation = location.trim();
    const capNum = parseInt(capacity, 10);

    return (
      trimTitle.length >= 5 &&
      trimTitle.length <= 50 &&
      trimLocation.length > 0 &&
      !isNaN(capNum) &&
      capNum >= 2 &&
      capNum <= 50
    );
  }, [title, location, capacity]);

  // Handle creation
  const handleCreate = useCallback(() => {
    if (!isValid) return;
    setShowSuccess(true);

    // Auto-close after 1.5s
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  }, [isValid, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      <View style={styles.sheetContainer}>
        <SafeAreaView edges={["bottom"]} style={styles.sheetSafe}>
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {showSuccess ? (
            /* ─── Success State ─── */
            <View style={styles.successContainer}>
              <View style={styles.successCircle}>
                <CheckCircle size={48} color="#38A169" />
              </View>
              <Text style={styles.successTitle}>Event Created!</Text>
              <Text style={styles.successSubtext}>
                Your event is now visible to others
              </Text>
            </View>
          ) : (
            /* ─── Form ─── */
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Create Event</Text>
                <Pressable style={styles.closeBtn} onPress={onClose}>
                  <X size={20} color="#4A5568" />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Title */}
                <View style={styles.field}>
                  <Text style={styles.label}>Event Title</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="What's happening?"
                    placeholderTextColor="#A0AEC0"
                    maxLength={50}
                  />
                  <Text style={styles.charCount}>{title.length}/50</Text>
                </View>

                {/* Location */}
                <View style={styles.field}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Where is it?"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>

                {/* Duration */}
                <View style={styles.field}>
                  <Text style={styles.label}>Duration</Text>
                  <View style={styles.optionRow}>
                    {DURATIONS.map((d) => (
                      <Pressable
                        key={d.label}
                        style={[
                          styles.optionPill,
                          duration === d.value
                            ? styles.optionPillActive
                            : styles.optionPillInactive,
                        ]}
                        onPress={() => setDuration(d.value)}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            duration === d.value
                              ? styles.optionPillTextActive
                              : styles.optionPillTextInactive,
                          ]}
                        >
                          {d.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Visibility */}
                <View style={styles.field}>
                  <Text style={styles.label}>Visibility</Text>
                  <View style={styles.optionRow}>
                    {VISIBILITY_OPTIONS.map((opt) => {
                      const isActive = visibility === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          style={[
                            styles.visPill,
                            isActive ? styles.visPillActive : styles.visPillInactive,
                          ]}
                          onPress={() => setVisibility(opt.value)}
                        >
                          <opt.Icon
                            size={16}
                            color={isActive ? "#FFFFFF" : "#4A5568"}
                          />
                          <Text
                            style={[
                              styles.visPillText,
                              isActive
                                ? styles.visPillTextActive
                                : styles.visPillTextInactive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Capacity */}
                <View style={styles.field}>
                  <Text style={styles.label}>Max Capacity (2-50)</Text>
                  <TextInput
                    style={[styles.input, styles.capacityInput]}
                    value={capacity}
                    onChangeText={setCapacity}
                    placeholder="20"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </ScrollView>

              {/* Create Button */}
              <View style={styles.footer}>
                <Pressable
                  style={[
                    styles.createBtn,
                    !isValid && styles.createBtnDisabled,
                  ]}
                  onPress={handleCreate}
                  disabled={!isValid}
                >
                  <Text style={styles.createBtnText}>Create Event</Text>
                </Pressable>
              </View>
            </>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetSafe: {
    flex: 1,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E0",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  // Form
  formContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 8,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2D3748",
    backgroundColor: "#F7FAFC",
    fontFamily: "Inter_400Regular",
  },
  charCount: {
    fontSize: 11,
    color: "#A0AEC0",
    textAlign: "right",
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  capacityInput: {
    width: 80,
  },
  // Option pills (duration)
  optionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  optionPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  optionPillActive: {
    backgroundColor: "#1A365D",
  },
  optionPillInactive: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionPillText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  optionPillTextActive: {
    color: "#FFFFFF",
  },
  optionPillTextInactive: {
    color: "#4A5568",
  },
  // Visibility pills
  visPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
  },
  visPillActive: {
    backgroundColor: "#1A365D",
  },
  visPillInactive: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  visPillText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  visPillTextActive: {
    color: "#FFFFFF",
  },
  visPillTextInactive: {
    color: "#4A5568",
  },
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  createBtn: {
    backgroundColor: "#1A365D",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    shadowColor: "#1A365D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  // Success state
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(56,161,105,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A365D",
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  successSubtext: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
});

CreateEventSheet.displayName = "CreateEventSheet";
