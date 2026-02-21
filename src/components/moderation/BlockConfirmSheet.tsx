import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlockConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
  onConfirm: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BLOCK_INFO_ITEMS = [
  "They won't be able to see your profile",
  "They can't send you messages",
  "They won't appear in your discovery",
  "You can unblock them later in Settings",
] as const;

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BlockConfirmSheet({
  visible,
  onClose,
  userName,
  userAvatar,
  onConfirm,
}: BlockConfirmSheetProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Block ${userName}?`}
    >
      {/* Avatar */}
      <Image
        source={{ uri: userAvatar }}
        style={s.avatar}
        resizeMode="cover"
      />

      {/* Info items */}
      <View style={s.infoList}>
        {BLOCK_INFO_ITEMS.map((item) => (
          <View key={item} style={s.infoRow}>
            <View style={s.bulletDot} />
            <Text style={s.infoText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={s.actionsRow}>
        <View style={{ flex: 1 }}>
          <Button variant="ghost" fullWidth onPress={onClose}>
            Cancel
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="danger" fullWidth onPress={handleConfirm}>
            Block
          </Button>
        </View>
      </View>
    </Modal>
  );
}

BlockConfirmSheet.displayName = "BlockConfirmSheet";

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
  infoList: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#CBD5E0",
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
});
