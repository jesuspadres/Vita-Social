import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import {
  Bug,
  Shield,
  AlertTriangle,
  HelpCircle,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARS = 500;
const MIN_DESCRIPTION_LENGTH = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportProblemSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface CategoryOption {
  key: string;
  label: string;
  Icon: LucideIcon;
}

const CATEGORIES: CategoryOption[] = [
  { key: "bug", label: "Bug", Icon: Bug },
  { key: "safety", label: "Safety Issue", Icon: Shield },
  { key: "inappropriate", label: "Inappropriate Content", Icon: AlertTriangle },
  { key: "other", label: "Other", Icon: HelpCircle },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryChip({
  option,
  selected,
  onPress,
}: {
  option: CategoryOption;
  selected: boolean;
  onPress: () => void;
}) {
  const { Icon, label } = option;
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        selected ? s.chipSelected : s.chipUnselected,
      ]}
    >
      <Icon
        size={14}
        color={selected ? "#FFFFFF" : "#374151"}
        strokeWidth={1.75}
      />
      <Text style={[s.chipText, selected ? s.chipTextSelected : s.chipTextUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReportProblemSheet({ visible, onClose }: ReportProblemSheetProps) {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const canSubmit =
    selectedCategory !== null && description.trim().length >= MIN_DESCRIPTION_LENGTH;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onClose();
    // Reset form
    setSelectedCategory(null);
    setDescription("");
    toast("Report submitted. Thank you for letting us know!", "success");
  }, [canSubmit, onClose, toast]);

  const handleClose = useCallback(() => {
    onClose();
    // Reset form after dismiss
    setTimeout(() => {
      setSelectedCategory(null);
      setDescription("");
    }, 300);
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={s.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Backdrop */}
        <Pressable style={s.backdrop} onPress={handleClose} />

        {/* Panel */}
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={[s.panel, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          {/* Drag handle */}
          <View style={s.dragHandle}>
            <View style={s.dragBar} />
          </View>

          {/* Title */}
          <Text style={s.title}>Report a Problem</Text>

          {/* Category selector */}
          <Text style={s.sectionLabel}>CATEGORY</Text>
          <View style={s.categoryRow}>
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.key}
                option={cat}
                selected={selectedCategory === cat.key}
                onPress={() => setSelectedCategory(cat.key)}
              />
            ))}
          </View>

          {/* Description */}
          <Text style={s.sectionLabel}>DESCRIPTION</Text>
          <View style={s.textAreaWrapper}>
            <TextInput
              style={s.textArea}
              value={description}
              onChangeText={(text) => {
                if (text.length <= MAX_CHARS) setDescription(text);
              }}
              placeholder="Describe the issue..."
              placeholderTextColor="#A0AEC0"
              multiline
              textAlignVertical="top"
              maxLength={MAX_CHARS}
            />
            <Text style={s.charCount}>
              {description.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* Submit */}
          <View style={s.submitWrapper}>
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={!canSubmit}
              onPress={handleSubmit}
            >
              Submit Report
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

ReportProblemSheet.displayName = "ReportProblemSheet";

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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: "92%",
  },

  // Drag handle
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

  // Title
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A0AEC0",
    letterSpacing: 1.2,
    marginBottom: 10,
    fontFamily: "Inter_700Bold",
  },

  // Category chips
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
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

  // Text area
  textAreaWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 20,
  },
  textArea: {
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    paddingVertical: 0,
  },
  charCount: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginTop: 8,
  },

  // Submit
  submitWrapper: {
    marginTop: 4,
    marginBottom: 8,
  },
});
