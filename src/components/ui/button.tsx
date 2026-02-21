import React, { type ReactNode, useCallback } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type ViewStyle,
  type PressableProps,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";

/* ─── Variant & Size Maps ─── */

const variantClasses = {
  primary: {
    container: "bg-[#1A365D]",
    text: "text-white",
    loaderColor: "#ffffff",
  },
  secondary: {
    container: "bg-[#4A90A4]",
    text: "text-white",
    loaderColor: "#ffffff",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-[#1A365D]",
    loaderColor: "#1A365D",
  },
  danger: {
    container: "bg-[#E53E3E]",
    text: "text-white",
    loaderColor: "#ffffff",
  },
} as const;

const sizeClasses = {
  sm: {
    container: "py-2 px-3",
    text: "text-sm",
  },
  md: {
    container: "py-3 px-5",
    text: "text-base",
  },
  lg: {
    container: "py-4 px-7",
    text: "text-lg",
  },
} as const;

/* ─── Shadow Styles ─── */

const elevatedShadow: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

/* ─── Spring Config ─── */

const PRESS_SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.6,
};

/* ─── Types ─── */

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

export interface ButtonProps extends Omit<PressableProps, "children"> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Show a loading spinner and disable interaction */
  loading?: boolean;
  /** Stretch to fill parent width */
  fullWidth?: boolean;
  /** Optional icon rendered before children */
  iconLeft?: ReactNode;
  /** Optional icon rendered after children */
  iconRight?: ReactNode;
  /** Button label content */
  children: ReactNode;
}

/* ─── Component ─── */

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  iconLeft,
  iconRight,
  children,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = variantClasses[variant];
  const s = sizeClasses[size];

  // Spring-physics press scale
  const pressScale = useSharedValue(1);

  const animatedWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      pressScale.value = withSpring(0.97, PRESS_SPRING_CONFIG);
      onPressIn?.(e);
    },
    [pressScale, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      pressScale.value = withSpring(1, PRESS_SPRING_CONFIG);
      onPressOut?.(e);
    },
    [pressScale, onPressOut],
  );

  return (
    <Animated.View style={[animatedWrapperStyle, fullWidth ? { width: "100%" } : undefined]}>
      <Pressable
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed, hovered }) => [
          variant !== "ghost" ? elevatedShadow : undefined,
          { opacity: isDisabled ? 0.7 : pressed ? 0.85 : 1 },
          typeof style === "function" ? style({ pressed, hovered }) : style,
        ]}
        className={cn(
          "flex-row items-center justify-center rounded-xl",
          v.container,
          s.container,
          fullWidth && "w-full",
        )}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={v.loaderColor}
            className="mr-2"
          />
        ) : iconLeft ? (
          <View className="mr-2">{iconLeft}</View>
        ) : null}

        {typeof children === "string" ? (
          <Text className={cn("font-semibold", v.text, s.text)}>{children}</Text>
        ) : (
          children
        )}

        {!loading && iconRight ? (
          <View className="ml-2">{iconRight}</View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

Button.displayName = "Button";
