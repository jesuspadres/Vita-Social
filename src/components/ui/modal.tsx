import React, { useEffect, type ReactNode } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

/* ─── Types ─── */

export interface ModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Modal title (optional) */
  title?: string;
  /** Content inside the modal */
  children: ReactNode;
  /** Show close button (default true) */
  showClose?: boolean;
}

/* ─── Component ─── */

export function Modal({
  visible,
  onClose,
  title,
  children,
  showClose = true,
}: ModalProps) {
  const insets = useSafeAreaInsets();

  // Animated slide-up
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezierFn(0.22, 1, 0.36, 1),
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(300, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
              },
              backdropStyle,
            ]}
          >
            <Pressable
              className="flex-1"
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
            />
          </Animated.View>

          {/* Panel */}
          <Animated.View
            className="bg-white rounded-t-3xl"
            style={[
              panelStyle,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                maxHeight: "90%",
              },
            ]}
            accessible={true}
            accessibilityRole="none"
            accessibilityViewIsModal={true}
            accessibilityLabel={title ? `${title} dialog` : "Dialog"}
          >
            {/* Drag handle */}
            <View className="items-center pt-3 pb-1">
              <View className="h-1 w-8 rounded-full bg-gray-300" />
            </View>

            {/* Header */}
            {(title || showClose) && (
              <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
                {title ? (
                  <Text className="text-lg font-bold text-gray-900">
                    {title}
                  </Text>
                ) : (
                  <View />
                )}
                {showClose && (
                  <Pressable
                    onPress={onClose}
                    className="rounded-full items-center justify-center"
                    style={{ minWidth: 44, minHeight: 44 }}
                    hitSlop={4}
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                  >
                    <X size={20} color="#6B7280" />
                  </Pressable>
                )}
              </View>
            )}

            {/* Content */}
            <View className="px-5 pt-2 pb-4">{children}</View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

Modal.displayName = "Modal";
