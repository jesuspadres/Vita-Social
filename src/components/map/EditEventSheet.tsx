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
  Calendar,
  Clock,
  MapPin,
  Minus,
  Plus,
  CheckCircle,
} from "lucide-react-native";
import { format } from "date-fns";
import { COLORS } from "@/lib/constants";
import type { EventVisibility } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

export interface EditEventSheetProps {
  visible: boolean;
  onClose: () => void;
  event: {
    title: string;
    description: string;
    starts_at: string;
    ends_at: string;
    location_name: string;
    visibility: string;
    max_capacity: number | null;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditEventSheet({ visible, onClose, event }: EditEventSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [capacity, setCapacity] = useState(20);
  const [showSuccess, setShowSuccess] = useState(false);

  // Populate form when sheet opens with event data
  useEffect(() => {
    if (visible && event) {
      setTitle(event.title);
      setDescription(event.description);
      setLocation(event.location_name);
      setVisibility((event.visibility as EventVisibility) || "public");
      setCapacity(event.max_capacity ?? 20);
      setShowSuccess(false);
    }
  }, [visible, event]);

  // Format date and time for display
  const dateStr = useMemo(() => {
    try {
      return format(new Date(event.starts_at), "EEE, MMM d, yyyy");
    } catch {
      return "Select date";
    }
  }, [event.starts_at]);

  const timeStr = useMemo(() => {
    try {
      const start = format(new Date(event.starts_at), "h:mm a");
      const end = format(new Date(event.ends_at), "h:mm a");
      return `${start} - ${end}`;
    } catch {
      return "Select time";
    }
  }, [event.starts_at, event.ends_at]);

  // Validation
  const isValid = useMemo(() => {
    const trimTitle = title.trim();
    const trimLocation = location.trim();
    return (
      trimTitle.length >= 3 &&
      trimTitle.length <= 50 &&
      trimLocation.length > 0 &&
      capacity >= 2 &&
      capacity <= 100
    );
  }, [title, location, capacity]);

  // Capacity stepper
  const decrementCapacity = useCallback(() => {
    setCapacity((prev) => Math.max(2, prev - 1));
  }, []);

  const incrementCapacity = useCallback(() => {
    setCapacity((prev) => Math.min(100, prev + 1));
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (!isValid) return;
    setShowSuccess(true);
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
            /* Success State */
            <View style={styles.successContainer}>
              <View style={styles.successCircle}>
                <CheckCircle size={48} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Changes Saved!</Text>
              <Text style={styles.successSubtext}>
                Your event has been updated
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Edit Event</Text>
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

                {/* Description */}
                <View style={styles.field}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Tell people what to expect..."
                    placeholderTextColor="#A0AEC0"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Date & Time */}
                <View style={styles.field}>
                  <Text style={styles.label}>Date & Time</Text>
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateTimeItem}>
                      <Calendar size={18} color={COLORS.secondary} />
                      <Text style={styles.dateTimeText}>{dateStr}</Text>
                    </View>
                    <View style={styles.dateTimeSeparator} />
                    <View style={styles.dateTimeItem}>
                      <Clock size={18} color={COLORS.secondary} />
                      <Text style={styles.dateTimeText}>{timeStr}</Text>
                    </View>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.field}>
                  <Text style={styles.label}>Location</Text>
                  <View style={styles.locationInputRow}>
                    <MapPin size={18} color={COLORS.secondary} />
                    <TextInput
                      style={styles.locationInput}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Where is it?"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>

                {/* Visibility */}
                <View style={styles.field}>
                  <Text style={styles.label}>Visibility</Text>
                  <View style={styles.visRow}>
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

                {/* Max Capacity */}
                <View style={styles.field}>
                  <Text style={styles.label}>Max Capacity</Text>
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={[
                        styles.stepperBtn,
                        capacity <= 2 && styles.stepperBtnDisabled,
                      ]}
                      onPress={decrementCapacity}
                      disabled={capacity <= 2}
                    >
                      <Minus size={18} color={capacity <= 2 ? "#CBD5E0" : COLORS.primary} />
                    </Pressable>
                    <View style={styles.stepperValue}>
                      <Text style={styles.stepperValueText}>{capacity}</Text>
                    </View>
                    <Pressable
                      style={[
                        styles.stepperBtn,
                        capacity >= 100 && styles.stepperBtnDisabled,
                      ]}
                      onPress={incrementCapacity}
                      disabled={capacity >= 100}
                    >
                      <Plus size={18} color={capacity >= 100 ? "#CBD5E0" : COLORS.primary} />
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Actions */}
              <View style={styles.footer}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveBtn,
                    !isValid && styles.saveBtnDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!isValid}
                >
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </Pressable>
              </View>
            </>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

EditEventSheet.displayName = "EditEventSheet";

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
    maxHeight: "92%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: "#A0AEC0",
    textAlign: "right",
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },

  // Date & Time
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dateTimeSeparator: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3748",
    fontFamily: "Inter_500Medium",
  },

  // Location
  locationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F7FAFC",
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    color: "#2D3748",
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },

  // Visibility pills
  visRow: {
    flexDirection: "row",
    gap: 8,
  },
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
    backgroundColor: COLORS.primary,
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

  // Capacity stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnDisabled: {
    opacity: 0.5,
  },
  stepperValue: {
    minWidth: 60,
    alignItems: "center",
  },
  stepperValueText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: "Inter_700Bold",
  },

  // Footer
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 52,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A5568",
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
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
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  successSubtext: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
});
