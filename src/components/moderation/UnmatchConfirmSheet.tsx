import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UnmatchConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
  onConfirm: () => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function UnmatchConfirmSheet({
  visible,
  onClose,
  userName,
  userAvatar,
  onConfirm,
}: UnmatchConfirmSheetProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Unmatch ${userName}?`}
    >
      {/* Avatar */}
      <Image
        source={{ uri: userAvatar }}
        style={s.avatar}
        resizeMode="cover"
      />

      {/* Warning text */}
      <Text style={s.warningText}>
        This will permanently remove your connection with {userName}. Your
        conversation history will be deleted and cannot be recovered.
      </Text>

      {/* Spacer */}
      <View style={s.spacer} />

      {/* Actions */}
      <View style={s.actionsRow}>
        <View style={{ flex: 1 }}>
          <Button variant="ghost" fullWidth onPress={onClose}>
            Cancel
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="danger" fullWidth onPress={handleConfirm}>
            Unmatch
          </Button>
        </View>
      </View>
    </Modal>
  );
}

UnmatchConfirmSheet.displayName = "UnmatchConfirmSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
    alignSelf: "center",
  },
  warningText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlign: "center",
  },
  spacer: {
    height: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
});
