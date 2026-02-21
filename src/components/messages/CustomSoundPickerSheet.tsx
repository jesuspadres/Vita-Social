import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Volume2, VolumeX } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomSoundPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  currentSound: string;
  onSelect: (sound: string) => void;
}

// ---------------------------------------------------------------------------
// Sound Options
// ---------------------------------------------------------------------------

interface SoundOption {
  id: string;
  label: string;
  silent: boolean;
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: "default", label: "Default", silent: false },
  { id: "chime", label: "Chime", silent: false },
  { id: "bell", label: "Bell", silent: false },
  { id: "ping", label: "Ping", silent: false },
  { id: "none", label: "None", silent: true },
  { id: "silent", label: "Silent", silent: true },
];

// ---------------------------------------------------------------------------
// Radio Circle
// ---------------------------------------------------------------------------

function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <View style={[s.radioOuter, selected && s.radioOuterSelected]}>
      {selected && <View style={s.radioInner} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sound Row
// ---------------------------------------------------------------------------

function SoundRow({
  item,
  selected,
  onPress,
}: {
  item: SoundOption;
  selected: boolean;
  onPress: () => void;
}) {
  const IconComponent = item.silent ? VolumeX : Volume2;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.soundRow, pressed && { backgroundColor: "#F7FAFC" }]}
      accessible={true}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={item.label}
    >
      <IconComponent
        size={18}
        color={selected ? COLORS.secondary : "#718096"}
        strokeWidth={1.75}
      />
      <Text style={[s.soundLabel, selected && s.soundLabelSelected]}>
        {item.label}
      </Text>
      <RadioCircle selected={selected} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CustomSoundPickerSheet({
  visible,
  onClose,
  currentSound,
  onSelect,
}: CustomSoundPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(currentSound);

  // Sync selected state when prop changes
  React.useEffect(() => {
    if (visible) {
      setSelected(currentSound);
    }
  }, [visible, currentSound]);

  const handleDone = () => {
    onSelect(selected);
    onClose();
  };

  const renderItem = ({ item }: { item: SoundOption }) => (
    <SoundRow
      item={item}
      selected={selected === item.label}
      onPress={() => setSelected(item.label)}
    />
  );

  const keyExtractor = (item: SoundOption) => item.id;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        {/* Dismiss backdrop */}
        <Pressable
          style={s.backdropPress}
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close sound picker"
        />

        {/* Panel */}
        <View style={[s.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Drag Handle */}
          <View style={s.dragHandle}>
            <View style={s.dragBar} />
          </View>

          {/* Title */}
          <Text style={s.title}>Notification Sound</Text>

          {/* Sound List */}
          <FlatList
            data={SOUND_OPTIONS}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={s.divider} />}
            style={s.list}
          />

          {/* Done Button */}
          <View style={s.buttonContainer}>
            <Button variant="primary" fullWidth onPress={handleDone}>
              Done
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

CustomSoundPickerSheet.displayName = "CustomSoundPickerSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropPress: {
    flex: 1,
  },

  // Panel
  panel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },

  // Drag Handle
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // List
  list: {
    paddingHorizontal: 20,
  },

  // Sound Row
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  soundLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  soundLabelSelected: {
    color: COLORS.secondary,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  // Radio
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.secondary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 30,
  },

  // Button
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
