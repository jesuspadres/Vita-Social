import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";

interface FabProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export function Fab({ onPress, accessibilityLabel = "Create new" }: FabProps) {
  return (
    <Pressable
      style={styles.fab}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Plus size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1A365D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A365D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9,
  },
});
